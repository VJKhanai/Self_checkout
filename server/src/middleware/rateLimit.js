const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { message: 'Too many OTP requests. Try again in a few minutes.' },
});

const authLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20 });
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 200 });

module.exports = { otpLimiter, authLimiter, apiLimiter };
