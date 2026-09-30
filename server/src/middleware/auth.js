const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { ApiError } = require('../utils/apiError');
const User = require('../models/User');
const Staff = require('../models/Staff');

function signToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

function setAuthCookie(res, token, name = 'token') {
  res.cookie(name, token, {
    httpOnly: true,
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function readToken(req, staff) {
  const name = staff ? 'staff_token' : 'token';
  if (req.cookies && req.cookies[name]) return req.cookies[name];
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

const requireAuth = (roles = ['customer']) => async (req, _res, next) => {
  try {
    const token = readToken(req, !roles.includes('customer'));
    if (!token) throw new ApiError(401, 'Not signed in');
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (!roles.includes(decoded.role)) throw new ApiError(403, 'Not allowed');
    const account =
      decoded.role === 'customer'
        ? await User.findById(decoded.sub)
        : await Staff.findById(decoded.sub);
    if (!account) throw new ApiError(401, 'Account no longer exists');
    req.auth = { id: String(account._id), role: decoded.role };
    req.account = account;
    next();
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError(401, 'Invalid or expired session'));
  }
};

module.exports = { signToken, setAuthCookie, requireAuth };
