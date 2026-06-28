/* eslint-disable */
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

function generatePasswordHash(password) {
  return bcrypt.hashSync(password, 10);
}

function generateJWTSecret() {
  return crypto.randomBytes(32).toString('hex');
}
module.exports = {
  generatePasswordHash,
  generateJWTSecret,
};