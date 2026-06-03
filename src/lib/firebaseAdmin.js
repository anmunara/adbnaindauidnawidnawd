import admin from 'firebase-admin';

if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    // Surface a misconfigured environment (e.g. a VPS missing service-account
    // env vars) clearly in the logs — otherwise adminDb is silently null and
    // every Firestore call fails downstream.
    const missing = [
        !projectId && 'FIREBASE_PROJECT_ID',
        !clientEmail && 'FIREBASE_CLIENT_EMAIL',
        !privateKey && 'FIREBASE_PRIVATE_KEY',
    ].filter(Boolean);
    if (missing.length) {
        console.warn(
            `[firebaseAdmin] Missing env var(s): ${missing.join(', ')}. ` +
            'Firebase Admin will NOT initialize; Firestore calls will fail.'
        );
    }

    if (projectId && clientEmail && privateKey) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey: privateKey.replace(/\\n/g, '\n'),
                }),
            });
        } catch (error) {
            console.error('Firebase admin initialization error', error.stack);
        }
    }
}

const adminAuth = admin.apps.length ? admin.auth() : null;
const adminDb = admin.apps.length ? admin.firestore() : null;

export { adminAuth, adminDb };
