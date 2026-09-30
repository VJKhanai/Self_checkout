const { asyncHandler, ApiError } = require('../utils/apiError');
const Order = require('../models/Order');
const { verifyExitToken } = require('../utils/exitToken');
const { sha256 } = require('../utils/crypto');

/** Decodes a scanned exit QR and returns the bill for the guard to compare. Does NOT consume it. */
exports.verify = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw new ApiError(400, 'QR is empty');
  let payload;
  try {
    payload = verifyExitToken(token);
  } catch (e) {
    throw new ApiError(400, e.name === 'TokenExpiredError' ? 'QR expired — ask the customer to refresh it' : 'Invalid QR — not issued by Self_checkout');
  }
  const order = await Order.findById(payload.orderId).select('+exitTokenHash').populate('brand', 'name').populate('user', 'name phone');
  if (!order) throw new ApiError(404, 'Order not found');
  if (req.account.role === 'guard' && req.account.brand && String(req.account.brand) !== String(order.brand._id))
    throw new ApiError(403, `This bill is for ${order.brand.name}, not this store`);
  if (order.paymentStatus !== 'PAID') throw new ApiError(400, 'Order is not paid');
  if (order.qrUsed || order.status === 'EXITED') throw new ApiError(409, 'QR already used — possible reuse attempt');
  if (order.exitTokenHash !== sha256(token)) throw new ApiError(409, 'This QR was replaced by a newer one');
  res.json({
    order: {
      id: order._id, brand: order.brand.name, customer: order.user?.name, phone: order.user?.phone,
      items: order.items, total: order.total, paidAt: order.updatedAt, auditRequired: order.auditRequired,
    },
  });
});

/** Guard confirms bag matches bill → QR is consumed atomically (single use). */
exports.confirmExit = asyncHandler(async (req, res) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, paymentStatus: 'PAID', qrUsed: false },
    { qrUsed: true, status: 'EXITED', verifiedBy: req.auth.id, verifiedAt: new Date(), $unset: { exitTokenHash: 1 } },
    { new: true }
  );
  if (!order) throw new ApiError(409, 'Already processed');
  res.json({ ok: true });
});

exports.flag = asyncHandler(async (req, res) => {
  const reason = String(req.body.reason || 'Mismatch at exit').slice(0, 200);
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, qrUsed: false },
    { status: 'FLAGGED', flagReason: reason, verifiedBy: req.auth.id, verifiedAt: new Date() },
    { new: true }
  );
  if (!order) throw new ApiError(409, 'Already processed');
  res.json({ ok: true });
});

exports.recent = asyncHandler(async (req, res) => {
  const orders = await Order.find({ verifiedBy: req.auth.id }).sort({ verifiedAt: -1 }).limit(20).populate('brand', 'name');
  res.json({ orders: orders.map((o) => ({ id: o._id, brand: o.brand?.name, total: o.total, status: o.status, verifiedAt: o.verifiedAt })) });
});
