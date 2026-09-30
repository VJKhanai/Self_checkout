const QRCode = require('qrcode');
const { asyncHandler, ApiError } = require('../utils/apiError');
const Order = require('../models/Order');
const Brand = require('../models/Brand');
const { issueExitToken } = require('../utils/exitToken');
const { streamInvoice } = require('../utils/invoice');

exports.myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.auth.id, paymentStatus: 'PAID' })
    .populate('brand', 'name logo')
    .sort({ createdAt: -1 });
  res.json({ orders });
});

exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.auth.id }).populate('brand', 'name logo');
  if (!order) throw new ApiError(404, 'Order not found');
  res.json({ order });
});

/** Re-issues the QR for an order that has not been used at the exit yet. */
exports.exitQr = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.auth.id }).select('+exitTokenHash');
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.paymentStatus !== 'PAID') throw new ApiError(400, 'This order is not paid');
  if (order.qrUsed || order.status === 'EXITED') throw new ApiError(409, 'This exit QR was already used');

  const { token, tokenHash, expiresAt } = issueExitToken(order._id);
  order.exitTokenHash = tokenHash;
  order.exitTokenExpiresAt = expiresAt;
  await order.save();

  const qr = await QRCode.toDataURL(token, { width: 320, margin: 1 });
  res.json({ exitQr: qr, expiresAt, auditRequired: order.auditRequired });
});

exports.invoice = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.auth.id });
  if (!order) throw new ApiError(404, 'Order not found');
  const brand = await Brand.findById(order.brand);
  streamInvoice(res, order, brand ? brand.name : 'Store');
});
