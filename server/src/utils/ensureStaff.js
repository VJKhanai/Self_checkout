const Staff = require('../models/Staff');

// Fixed staff accounts from .env, created/updated on every server start.
async function ensureFixedStaff() {
  const accounts = [
    { username: process.env.ADMIN_USERNAME || 'admin', password: process.env.ADMIN_PASSWORD || 'admin@123', role: 'admin' },
    { username: process.env.GUARD_USERNAME || 'guard1', password: process.env.GUARD_PASSWORD || 'guard@123', role: 'guard' },
  ];
  for (const a of accounts) {
    const passwordHash = await Staff.hashPassword(a.password);
    await Staff.findOneAndUpdate(
      { username: a.username.toLowerCase() },
      { username: a.username.toLowerCase(), passwordHash, role: a.role },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log('Fixed staff ready');
}

module.exports = { ensureFixedStaff };
