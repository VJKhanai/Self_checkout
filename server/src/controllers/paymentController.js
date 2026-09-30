const mongoose = require('mongoose');
const QRCode = require('qrcode');
const env = require('../config/env');
const { asyncHandler, ApiError } = require('../utils/apiError');
const gateway = require('../utils/paymentGateway');
const { buildOrderLines } = require('../utils/pricing');
const { issueExitToken } = require('../utils/exitToken');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');

/** Step 1: build a PENDING order from server-side prices and open a gateway order. */
exports.createPaymentOrder = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.auth.id });
  if (!cart || cart.items.length === 0) throw new ApiError(400, 'Your cart is empty');

  const products = await Product.find({ _id: { $in: cart.items.map((i) => i.product) } });
  if (products.length !== cart.items.length) throw new ApiError(409, 'A product in your cart is unavailable');
  const { lines, subtotal, gstTotal, total } = buildOrderLines(products, cart.items);

  const gatewayOrder = await gateway.createOrder({ amount: total, receipt: `rcpt_${Date.now()}` });

  const order = await Order.create({
    user: req.auth.id,
    brand: cart.brand,
    items: lines.map(({ lineNet, ...rest }) => rest),
    subtotal,
    gstTotal,
    total,
    gatewayOrderId: gatewayOrder.id,
    paymentStatus: 'CREATED',
    status: 'PENDING',
  });

  res.status(201).json({
    orderId: order._id,
    gatewayOrder,
    // In the simulated gateway the client asks the server to "pay"; with real
    // Razorpay the client opens checkout with keyId + gatewayOrder.id instead.
    simulated: env.PAYMENT_PROVIDER === 'mock',
  });
});

/** Simulated checkout: issues a payment id + valid signature, mimicking the SDK callback. */
exports.simulateCheckout = asyncHandler(async (req, res) => {
  const { gatewayOrderId, outcome = 'success' } = req.body;
  const order = await Order.findOne({ gatewayOrderId, user: req.auth.id });
  if (!order) throw new ApiError(404, 'Payment order not found');
  if (outcome === 'failure') {
    order.paymentStatus = 'FAILED';
    await order.save();
    throw new ApiError(402, 'Payment declined by bank (simulated)');
  }
  const paymentId = `pay_mock_${Date.now().toString(36)}`;
  res.json({
    razorpay_order_id: gatewayOrderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: gateway.signPayment(gatewayOrderId, paymentId),
  });
});

async function markOrderPaid(order) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of order.items) {
        const updated = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.qty } },
          { $inc: { stock: -item.qty } },
          { session, new: true }
        );
        if (!updated) throw new ApiError(409, `${item.name} just went out of stock`);
      }
      const { token, tokenHash, expiresAt } = issueExitToken(order._id);
      order.paymentStatus = 'PAID';
      order.status = 'PAID';
      order.exitTokenHash = tokenHash;
      order.exitTokenExpiresAt = expiresAt;
      order.qrUsed = false;
      order.auditRequired = Math.random() < env.AUDIT_RATE;
      await order.save({ session });
      order._exitToken = token;
    });
  } catch (err) {
    // Standalone MongoDB has no transactions: fall back to a non-atomic path.
    if (String(err.message).includes('Transaction numbers') || err.code === 20) {
      for (const item of order.items) {
        await Product.updateOne({ _id: item.product, stock: { $gte: item.qty } }, { $inc: { stock: -item.qty } });
      }
      const { token, tokenHash, expiresAt } = issueExitToken(order._id);
      order.paymentStatus = 'PAID';
      order.status = 'PAID';
      order.exitTokenHash = tokenHash;
      order.exitTokenExpiresAt = expiresAt;
      order.auditRequired = Math.random() < env.AUDIT_RATE;
      await order.save();
      order._exitToken = token;
    } else throw err;
  } finally {
    await session.endSession();
  }
  await Cart.findOneAndDelete({ user: order.user });
  return order;
}

/** Step 2: verify the HMAC signature server-side before trusting the payment. */
exports.verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const order = await Order.findOne({ gatewayOrderId: razorpay_order_id, user: req.auth.id });
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.paymentStatus === 'PAID') return res.json({ orderId: order._id, alreadyPaid: true });

  const valid = gateway.verifySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });
  if (!valid) {
    order.paymentStatus = 'FAILED';
    await order.save();
    throw new ApiError(400, 'Payment signature verification failed');
  }

  order.gatewayPaymentId = razorpay_payment_id;
  await markOrderPaid(order);

  const qrDataUrl = await QRCode.toDataURL(order._exitToken, { width: 320, margin: 1 });
  res.json({ orderId: order._id, status: order.status, exitQr: qrDataUrl, auditRequired: order.auditRequired });
});

/** Backup path: gateway webhook marks the order paid if the browser never returned. */
exports.webhook = asyncHandler(async (req, res) => {
  const { event, payload } = req.body || {};
  if (event !== 'payment.captured') return res.json({ received: true });
  const order = await Order.findOne({ gatewayOrderId: payload?.order_id });
  if (order && order.paymentStatus !== 'PAID') {
    order.gatewayPaymentId = payload.payment_id;
    await markOrderPaid(order);
  }
  res.json({ received: true });
});

exports.markOrderPaid = markOrderPaid;
