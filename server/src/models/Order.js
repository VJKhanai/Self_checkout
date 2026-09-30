const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        qty: Number,
        gstPercent: Number,
        gstAmount: Number,
        image: String,
        size: String,
      },
    ],
    subtotal: { type: Number, required: true },
    gstTotal: { type: Number, required: true },
    total: { type: Number, required: true },
    gatewayOrderId: { type: String, index: true },
    gatewayPaymentId: { type: String },
    paymentStatus: { type: String, enum: ['CREATED', 'PAID', 'FAILED'], default: 'CREATED' },
    status: { type: String, enum: ['PENDING', 'PAID', 'VERIFIED', 'EXITED', 'FLAGGED'], default: 'PENDING' },
    exitTokenHash: { type: String, select: false },
    exitTokenExpiresAt: { type: Date },
    qrUsed: { type: Boolean, default: false },
    auditRequired: { type: Boolean, default: false },
    flagReason: { type: String },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
