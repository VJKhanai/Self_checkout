import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const firebaseReady = Object.values(firebaseConfig).every(Boolean);

const app = firebaseReady ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
let recaptchaVerifier = null;

function ensureRecaptchaContainer() {
  let host = document.getElementById('firebase-recaptcha');
  if (!host) {
    host = document.createElement('div');
    host.id = 'firebase-recaptcha';
    host.style.display = 'none';
    document.body.appendChild(host);
  }
  return host;
}

export async function sendFirebaseOtp(phone) {
  if (!auth) {
    throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* values in the client .env file and enable Phone Authentication in Firebase.');
  }

  const normalizedPhone = phone.startsWith('+') ? phone : `+91${String(phone).replace(/\D/g, '')}`;

  try {
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
    }

    ensureRecaptchaContainer();
    recaptchaVerifier = new RecaptchaVerifier(auth, 'firebase-recaptcha', {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => {},
    });

    const confirmation = await signInWithPhoneNumber(auth, normalizedPhone, recaptchaVerifier);
    return { confirmation, recaptcha: recaptchaVerifier };
  } catch (error) {
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
      } catch {
        // ignore cleanup errors
      }
      recaptchaVerifier = null;
    }

    if (error?.code === 'auth/operation-not-allowed') {
      throw new Error('Firebase Phone Authentication is disabled in your Firebase project. Enable Phone sign-in in Authentication > Sign-in method.');
    }
    if (error?.code === 'auth/missing-client-configuration') {
      throw new Error('Firebase web config is incomplete. Check the VITE_FIREBASE_* values in the client .env file.');
    }
    throw error;
  }
}

export async function confirmFirebaseOtp(confirmation, code) {
  if (!confirmation) throw new Error('OTP request expired. Please request a new code.');
  const result = await confirmation.confirm(code);
  return result.user;
}
