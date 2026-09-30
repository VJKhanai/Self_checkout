const { asyncHandler, ApiError } = require('../utils/apiError');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { buildOrderLines } = require('../utils/pricing');

async function priceCart(cart) {
  if (!cart) return null;
  const products = await Product.find({ _id: { $in: cart.items.map((i) => i.product) } });
  const { lines, subtotal, gstTotal, total } = buildOrderLines(products, cart.items);
  return { id: cart._id, brand: cart.brand, items: lines, subtotal, gstTotal, total };
}

exports.getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.auth.id });
  res.json({ cart: await priceCart(cart) });
});

exports.addItem = asyncHandler(async (req, res) => {
  const { productId, brandId, qty = 1 } = req.body;
  const product = await Product.findOne({ _id: productId, brand: brandId });
  if (!product) throw new ApiError(404, 'Product not found in this store');
  if (product.stock < qty) throw new ApiError(409, 'Not enough stock');

  let cart = await Cart.findOne({ user: req.auth.id });
  if (!cart) cart = new Cart({ user: req.auth.id, brand: brandId, items: [] });
  if (String(cart.brand) !== String(brandId)) {
    cart.brand = brandId;
    cart.items = [];
  }
  const existing = cart.items.find((i) => String(i.product) === String(productId));
  if (existing) existing.qty += qty;
  else cart.items.push({ product: productId, qty });
  await cart.save();
  res.status(201).json({ cart: await priceCart(cart) });
});

exports.updateItem = asyncHandler(async (req, res) => {
  const { qty } = req.body;
  const cart = await Cart.findOne({ user: req.auth.id });
  if (!cart) throw new ApiError(404, 'Cart is empty');
  const item = cart.items.find((i) => String(i.product) === String(req.params.productId));
  if (!item) throw new ApiError(404, 'Item not in cart');
  if (qty <= 0) cart.items = cart.items.filter((i) => i !== item);
  else item.qty = qty;
  await cart.save();
  res.json({ cart: await priceCart(cart) });
});

exports.removeItem = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.auth.id });
  if (!cart) throw new ApiError(404, 'Cart is empty');
  cart.items = cart.items.filter((i) => String(i.product) !== String(req.params.productId));
  await cart.save();
  res.json({ cart: await priceCart(cart) });
});

exports.clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndDelete({ user: req.auth.id });
  res.json({ cart: null });
});

exports.priceCart = priceCart;
