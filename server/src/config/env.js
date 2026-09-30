require('dotenv').config();

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/self_checkout',
  CLIENT_ORIGIN: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(','),
  JWT_SECRET: process.env.JWT_SECRET || 'dev_jwt_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  EXIT_TOKEN_SECRET: process.env.EXIT_TOKEN_SECRET || 'dev_exit_secret',
  EXIT_TOKEN_TTL_MINUTES: Number(process.env.EXIT_TOKEN_TTL_MINUTES || 120),
  OTP_PROVIDER: process.env.OTP_PROVIDER || 'mock',
  MOCK_OTP: process.env.MOCK_OTP || '123456',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || '',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_FROM: process.env.TWILIO_FROM || '',
  PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || 'mock',
  PAYMENT_KEY_ID: process.env.PAYMENT_KEY_ID || 'mock_key_id',
  PAYMENT_KEY_SECRET: process.env.PAYMENT_KEY_SECRET || 'mock_key_secret',
  AUDIT_RATE: Number(process.env.AUDIT_RATE || 0.1),
};

module.exports = env;
