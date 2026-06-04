import bcrypt from 'bcryptjs';
import { db } from './db.js';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

export async function hashPassword(password) {
    return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
}

export function validatePassword(password) {
    if (!password || password.length < 8 || password.length > 128) {
        return { valid: false, error: 'Password must be 8-128 characters' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, error: 'Password must contain uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, error: 'Password must contain lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, error: 'Password must contain digit' };
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        return { valid: false, error: 'Password must contain special character' };
    }
    return { valid: true };
}

export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export async function createUser({ email, password, name, whatsapp, role = 'user' }) {
    if (!validateEmail(email)) {
        throw new Error('Invalid email format');
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        throw new Error(passwordValidation.error);
    }

    const existingUserSnap = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!existingUserSnap.empty) {
        throw new Error('Email already registered');
    }

    const userId = generateUserId();
    const passwordHash = await hashPassword(password);

    await db.collection('users').doc(userId).set({
        email,
        password_hash: passwordHash,
        name,
        whatsapp: whatsapp || null,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    });

    return {
        id: userId,
        email,
        name,
        role
    };
}

export async function authenticateUser(email, password) {
    const usersSnap = await db.collection('users').where('email', '==', email).limit(1).get();

    if (usersSnap.empty) {
        return null;
    }

    const userDoc = usersSnap.docs[0];
    const userData = userDoc.data();

    const isValid = await verifyPassword(password, userData.password_hash);
    if (!isValid) {
        return null;
    }

    return {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        whatsapp: userData.whatsapp
    };
}

export async function getUserById(userId) {
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
        return null;
    }

    const userData = userDoc.data();
    return {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        whatsapp: userData.whatsapp
    };
}

export async function updateUser(userId, updates) {
    const allowedUpdates = {};

    if (updates.name !== undefined) {
        allowedUpdates.name = updates.name;
    }
    if (updates.whatsapp !== undefined) {
        allowedUpdates.whatsapp = updates.whatsapp;
    }
    if (updates.email !== undefined) {
        if (!validateEmail(updates.email)) {
            throw new Error('Invalid email format');
        }
        allowedUpdates.email = updates.email;
    }
    if (updates.password !== undefined) {
        const passwordValidation = validatePassword(updates.password);
        if (!passwordValidation.valid) {
            throw new Error(passwordValidation.error);
        }
        allowedUpdates.password_hash = await hashPassword(updates.password);
    }

    if (Object.keys(allowedUpdates).length === 0) {
        return;
    }

    await db.collection('users').doc(userId).update(allowedUpdates);
}

export function isAdmin(user) {
    if (!user || !user.email) return false;
    return user.role === 'admin' || ADMIN_EMAILS.includes(user.email);
}

export async function requireAuth(request) {
    const session = await getServerSession(request);
    if (!session || !session.user) {
        return { error: 'Unauthorized', status: 401 };
    }
    return { user: session.user };
}

export async function requireAdmin(request) {
    const authResult = await requireAuth(request);
    if (authResult.error) {
        return authResult;
    }

    if (!isAdmin(authResult.user)) {
        return { error: 'Forbidden - Admin access required', status: 403 };
    }

    return { user: authResult.user };
}

function generateUserId() {
    return 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}

async function getServerSession(request) {
    return null;
}
