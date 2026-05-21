const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

let serviceAccount;

try {
    // 1. Try to construct from individual env vars (Preferred)
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        };
    }
    // 2. Try to load from file path defined in env
    else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (serviceAccountPath.endsWith('.json')) {
            serviceAccount = require(path.resolve(__dirname, serviceAccountPath));
        } else {
            serviceAccount = JSON.parse(serviceAccountPath);
        }
    }
} catch (error) {
    console.error('Error parsing Firebase credentials:', error);
}

if (!admin.apps.length) {
    if (serviceAccount) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('Firebase Admin Initialized Successfully');
        } catch (initError) {
            console.error('Error during admin.initializeApp:', initError);
        }
    } else {
        console.warn('WARNING: No valid Firebase Service Account found. Database operations will fail.');
        // Initialize with default (might work if on GCP, but unlikely here) or don't initialize
    }
}

const db = admin.apps.length ? admin.firestore() : null;

module.exports = { admin, db };
