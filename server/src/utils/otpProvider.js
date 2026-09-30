const env = require('../config/env');

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length > 10) return `+${digits}`;
  return `+${digits}`;
}

/**
 * Swappable OTP provider. `mock` never sends an SMS and always uses env.MOCK_OTP.
 * Set OTP_PROVIDER=twilio and provide Twilio credentials in .env to use real SMS OTP.
 */
const providers = {
  mock: {
    async generate() {
      return env.MOCK_OTP;
    },
    async send(phone, code) {
      console.log(`[otp:mock] code for ${phone} is ${code}`);
    },
  },
  twilio: {
    async generate() {
      return String(Math.floor(100000 + Math.random() * 900000));
    },
    async send(phone, code) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID || env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN || env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_FROM || env.TWILIO_FROM;

      if (!accountSid || !authToken || !from) {
        throw new Error('Twilio credentials are missing. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM in your .env file.');
      }

      const twilio = require('twilio')(accountSid, authToken);
      const to = normalizePhone(phone);

      await twilio.messages.create({
        to,
        from,
        body: `Your Self_checkout code is ${code}`,
      });
    },
  },
};

module.exports = Object.assign({}, providers[env.OTP_PROVIDER] || providers.mock, { normalizePhone });
