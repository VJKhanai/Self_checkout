const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },
    barcode: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    gstPercent: { type: Number, default: 5, min: 0, max: 28 },
    size: { type: String, default: '' },
    image: { type: String, default: '' },
    stock: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

productSchema.index({ brand: 1, barcode: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);
