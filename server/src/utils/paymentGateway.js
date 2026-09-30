const env = require('../config/env');
const { hmac, randomHex, safeEqual } = require('./crypto');

/**
 * Razorpay-shaped simulated gateway: same create-order / verify-signature /
 * webhook contract, but no real money moves. Swap this file for the real
 * Razorpay SDK and the controllers stay unchanged.
 */
async function createOrder({ amount, receipt }) {
  return {
    id: `order_mock_${randomHex(8)}`,
    amount: Math.round(amount * 100),
    currency: 'INR',
    receipt,
    status: 'created',
    keyId: env.PAYMENT_KEY_ID,
  };
}

function signPayment(orderId, paymentId) {
  return hmac(`${orderId}|${paymentId}`, env.PAYMENT_KEY_SECRET);
}

function verifySignature({ orderId, paymentId, signature }) {
  return safeEqual(signPayment(orderId, paymentId), signature);
}

module.exports = { createOrder, signPayment, verifySignature };
