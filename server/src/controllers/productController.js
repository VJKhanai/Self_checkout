const { asyncHandler, ApiError } = require('../utils/apiError');
const Product = require('../models/Product');

exports.getByBarcode = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const { brand } = req.query;
  if (!brand) throw new ApiError(400, 'Choose a store first');
  const product = await Product.findOne({ barcode: code.trim(), brand });
  if (!product) throw new ApiError(404, 'This barcode is not in the selected store');
  if (product.stock <= 0) throw new ApiError(409, 'Out of stock');
  res.json({ product });
});

exports.listByBrand = asyncHandler(async (req, res) => {
  const products = await Product.find({ brand: req.params.brandId }).sort({ name: 1 }).limit(200);
  res.json({ products });
});
