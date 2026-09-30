const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { otpLimiter, authLimiter } = require('../middleware/rateLimit');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/authController');

router.post(
  '/send-otp',
  otpLimiter,
  body('name').trim().isLength({ min: 2 }).withMessage('Enter your name'),
  body('phone').trim().matches(/^\+?[1-9]\d{9,14}$/).withMessage('Enter a valid mobile number'),
  validate,
  c.sendOtp
);

router.post(
  '/verify-otp',
  authLimiter,
  body('phone').trim().matches(/^\+?[1-9]\d{9,14}$/).withMessage('Enter a valid mobile number'),
  body('code').trim().isLength({ min: 4, max: 8 }).withMessage('Enter the OTP'),
  validate,
  c.verifyOtp
);

router.post(
  '/firebase-login',
  authLimiter,
  body('idToken').trim().isLength({ min: 10 }).withMessage('Missing Firebase session token'),
  body('phone').optional().isString(),
  validate,
  c.firebaseLogin
);

router.get('/me', requireAuth(['customer', 'guard', 'admin']), c.me);
router.post('/logout', c.logout);

module.exports = router;
