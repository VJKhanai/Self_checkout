const { asyncHandler, ApiError } = require('../utils/apiError');
const Staff = require('../models/Staff');
const { signToken, setAuthCookie } = require('../middleware/auth');

exports.login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const staff = await Staff.findOne({ username: String(username || '').toLowerCase() });
  if (!staff || !(await staff.comparePassword(String(password || '')))) throw new ApiError(401, 'Wrong username or password');
  setAuthCookie(res, signToken({ sub: String(staff._id), role: staff.role }), 'staff_token');
  res.json({ staff: { id: staff._id, username: staff.username, role: staff.role, brand: staff.brand } });
});

exports.me = asyncHandler(async (req, res) => {
  const s = req.account;
  res.json({ staff: { id: s._id, username: s.username, role: s.role, brand: s.brand } });
});

exports.logout = (_req, res) => {
  res.clearCookie('staff_token');
  res.json({ ok: true });
};
