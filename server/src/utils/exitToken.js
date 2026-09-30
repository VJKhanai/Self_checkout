const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { sha256, randomHex } = require('./crypto');

/** Signed, single-use exit QR payload. Only the hash is stored server-side. */
function issueExitToken(orderId) {
  const nonce = randomHex(12);
  const expiresAt = new Date(Date.now() + env.EXIT_TOKEN_TTL_MINUTES * 60 * 1000);
  const token = jwt.sign({ orderId: String(orderId), nonce }, env.EXIT_TOKEN_SECRET, {
    expiresIn: `${env.EXIT_TOKEN_TTL_MINUTES}m`,
  });
  return { token, tokenHash: sha256(token), expiresAt };
}

function verifyExitToken(token) {
  return jwt.verify(token, env.EXIT_TOKEN_SECRET);
}

module.exports = { issueExitToken, verifyExitToken };
