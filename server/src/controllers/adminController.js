const { asyncHandler, ApiError } = require('../utils/apiError');
const Order = require('../models/Order');
const Brand = require('../models/Brand');
const Product = require('../models/Product');
const Staff = require('../models/Staff');
const User = require('../models/User');

const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));

exports.stats = asyncHandler(async (_req, res) => {
  const since = new Date(); since.setHours(0, 0, 0, 0);
  const [customers, paidToday, revenue, flagged, byBrand] = await Promise.all([
    User.countDocuments(),
    Order.countDocuments({ paymentStatus: 'PAID', createdAt: { $gte: since } }),
    Order.aggregate([{ $match: { paymentStatus: 'PAID' } }, { $group: { _id: null, sum: { $sum: '$total' } } }]),
    Order.countDocuments({ status: 'FLAGGED' }),
    Order.aggregate([
      { $match: { paymentStatus: 'PAID' } },
      { $group: { _id: '$brand', orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
      { $lookup: { from: 'brands', localField: '_id', foreignField: '_id', as: 'b' } },
      { $project: { name: { $arrayElemAt: ['$b.name', 0] }, orders: 1, revenue: 1 } },
    ]),
  ]);
  res.json({ customers, paidToday, revenue: revenue[0]?.sum || 0, flagged, byBrand });
});

// Brands
exports.listBrands = asyncHandler(async (_q, res) => res.json({ brands: await Brand.find().sort({ name: 1 }) }));
exports.createBrand = asyncHandler(async (req, res) => res.status(201).json({ brand: await Brand.create(pick(req.body, ['name', 'logo', 'isActive'])) }));
exports.updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findByIdAndUpdate(req.params.id, pick(req.body, ['name', 'logo', 'isActive']), { new: true, runValidators: true });
  if (!brand) throw new ApiError(404, 'Brand not found');
  res.json({ brand });
});

// Products
const P = ['name', 'barcode', 'price', 'gstPercent', 'size', 'image', 'stock', 'brand'];
exports.listProducts = asyncHandler(async (req, res) => {
  const q = req.query.brand ? { brand: req.query.brand } : {};
  res.json({ products: await Product.find(q).populate('brand', 'name').sort({ createdAt: -1 }).limit(500) });
});
exports.createProduct = asyncHandler(async (req, res) => res.status(201).json({ product: await Product.create(pick(req.body, P)) }));
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, pick(req.body, P), { new: true, runValidators: true });
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ product });
});
exports.deleteProduct = asyncHandler(async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// Staff
exports.listStaff = asyncHandler(async (_q, res) => res.json({ staff: await Staff.find().select('-passwordHash').populate('brand', 'name') }));
exports.createStaff = asyncHandler(async (req, res) => {
  const { username, password, role, brand } = req.body;
  if (!username || !password || String(password).length < 6) throw new ApiError(400, 'Username and a 6+ character password are required');
  if (!['guard', 'admin'].includes(role)) throw new ApiError(400, 'Role must be guard or admin');
  const s = await Staff.create({ username, role, brand: brand || undefined, passwordHash: await Staff.hashPassword(password) });
  res.status(201).json({ staff: { id: s._id, username: s.username, role: s.role } });
});
exports.deleteStaff = asyncHandler(async (req, res) => {
  if (req.params.id === req.auth.id) throw new ApiError(400, "You can't delete yourself");
  await Staff.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// Orders
exports.listOrders = asyncHandler(async (req, res) => {
  const q = {};
  if (req.query.status) q.status = req.query.status;
  if (req.query.brand) q.brand = req.query.brand;
  const orders = await Order.find(q).sort({ createdAt: -1 }).limit(200).populate('brand', 'name').populate('user', 'name phone').populate('verifiedBy', 'username');
  res.json({ orders });
});
