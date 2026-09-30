const { asyncHandler, ApiError } = require('../utils/apiError');
const Brand = require('../models/Brand');

exports.listBrands = asyncHandler(async (_req, res) => {
  const brands = await Brand.find({ isActive: true }).sort({ name: 1 });
  res.json({ brands });
});

exports.getBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) throw new ApiError(404, 'Store not found');
  res.json({ brand });
});
