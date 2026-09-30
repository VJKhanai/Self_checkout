const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/paymentController');

router.post('/create-order', requireAuth(['customer']), c.createPaymentOrder);
router.post('/simulate', requireAuth(['customer']), body('gatewayOrderId').isString(), validate, c.simulateCheckout);
router.post(
  '/verify',
  requireAuth(['customer']),
  body('razorpay_order_id').isString(),
  body('razorpay_payment_id').isString(),
  body('razorpay_signature').isString(),
  validate,
  c.verifyPayment
);
router.post('/webhook', c.webhook);

module.exports = router;
