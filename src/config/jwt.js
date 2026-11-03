require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'cambiar_en_produccion',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  algorithm: 'HS256',
};
