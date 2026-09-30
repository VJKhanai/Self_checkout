const crypto = require('crypto');

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

const hmac = (value, secret) => crypto.createHmac('sha256', secret).update(String(value)).digest('hex');

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = { sha256, hmac, safeEqual, randomHex: (n = 16) => crypto.randomBytes(n).toString('hex') };
