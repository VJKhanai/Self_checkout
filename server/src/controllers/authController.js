const { asyncHandler, ApiError } = require('../utils/apiError');
const { sha256, safeEqual } = require('../utils/crypto');
const otpProvider = require('../utils/otpProvider');
const env = require('../config/env');
const admin = require('../config/firebase');
const Otp = require('../models/Otp');
const User = require('../models/User');
const { signToken, setAuthCookie } = require('../middleware/auth');

exports.sendOtp = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const normalizedPhone = otpProvider.normalizePhone ? otpProvider.normalizePhone(phone) : phone;
  const code = await otpProvider.generate();
  await Otp.findOneAndUpdate(
    { phone: normalizedPhone },
    { phone: normalizedPhone, name, codeHash: sha256(code), attempts: 0, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
    { upsert: true }
  );
  await otpProvider.send(normalizedPhone, code);
  res.json({
    message: 'OTP sent',
    devHint: env.OTP_PROVIDER === 'mock' ? `Dev mode: use ${env.MOCK_OTP}` : undefined,
  });
});

exports.verifyOtp = asyncHandler(async (req, res) => {
  const { phone, code } = req.body;
  const normalizedPhone = otpProvider.normalizePhone ? otpProvider.normalizePhone(phone) : phone;
  const record = await Otp.findOne({ phone: normalizedPhone });
  if (!record) throw new ApiError(400, 'Request a new OTP');
  if (record.expiresAt < new Date()) throw new ApiError(400, 'OTP expired');
  if (record.attempts >= 5) throw new ApiError(429, 'Too many wrong attempts');
  if (!safeEqual(sha256(code), record.codeHash)) {
    record.attempts += 1;
    await record.save();
    throw new ApiError(400, 'Incorrect OTP');
  }

  let user = await User.findOne({ phone: normalizedPhone });
  if (!user) user = await User.create({ name: record.name || 'Customer', phone: normalizedPhone });
  else if (record.name && record.name !== user.name) {
    user.name = record.name;
    await user.save();
  }
  await record.deleteOne();

  setAuthCookie(res, signToken({ sub: String(user._id), role: 'customer' }));
  res.json({ user: { id: user._id, name: user.name, phone: user.phone, role: 'customer' } });
});

exports.firebaseLogin = asyncHandler(async (req, res) => {
  const { idToken, phone, name } = req.body;
  if (!idToken) throw new ApiError(400, 'Missing Firebase ID token');

  const decoded = await admin.auth().verifyIdToken(idToken);
  const verifiedPhone = (decoded.phone_number || phone || '').trim();
  const normalizedPhone = verifiedPhone.startsWith('+') ? verifiedPhone : `+${String(verifiedPhone).replace(/\D/g, '')}`;

  if (!normalizedPhone) throw new ApiError(400, 'Phone number missing from Firebase session');

  let user = await User.findOne({ phone: normalizedPhone });
  if (!user) user = await User.create({ name: name || 'Customer', phone: normalizedPhone });
  else if (name && name !== user.name) {
    user.name = name;
    await user.save();
  }

  setAuthCookie(res, signToken({ sub: String(user._id), role: 'customer' }));
  res.json({ user: { id: user._id, name: user.name, phone: user.phone, role: 'customer' } });
});

exports.me = asyncHandler(async (req, res) => {
  const u = req.account;
  res.json({ user: { id: u._id, name: u.name, phone: u.phone, role: req.auth.role } });
});

exports.logout = asyncHandler(async (_req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Signed out' });
});
