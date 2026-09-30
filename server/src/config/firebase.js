const admin = require('firebase-admin');

if (admin.getApps().length === 0) {
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const certFn = (admin.credential && admin.credential.cert) ? admin.credential.cert.bind(admin.credential) : admin.cert;

  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      credential: certFn({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  } else {
    admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project' });
  }
}

module.exports = admin;
