const bcrypt = require('bcryptjs');
const crypto = require('crypto');

function generatePasswordHash(password) {
  return bcrypt.hashSync(password, 10);
}

function generateJWTSecret() {
  return crypto.randomBytes(32).toString('hex');
}

// Example usage
console.log('=== Village Management System Setup ===\n');

// Generate JWT Secret
console.log('JWT Secret (copy to JWT_SECRET in .env.local):');
console.log(generateJWTSecret());
console.log();

// Generate password hash for 'admin123'
console.log('Password Hash for "admin123" (copy to ADMIN_PASSWORD_HASH in .env.local):');
console.log(generatePasswordHash('admin123'));
console.log();

// Generate password hash for a custom password
const customPassword = process.argv[2];
if (customPassword) {
  console.log(`Password Hash for "${customPassword}":`);
  console.log(generatePasswordHash(customPassword));
  console.log();
}

console.log('Usage: node generate-credentials.js [custom_password]');
console.log('Example: node generate-credentials.js mySecurePassword123');