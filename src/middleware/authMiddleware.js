// Middleware de autenticación: verificar (JWT) y soloAdmin (rol).
const authService = require('../services/authService');

function verificar(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || typeof authHeader !== 'string') {
    return res.status(401).json({ ok: false, mensaje: 'Falta el token de acceso.' });
  }

  const partes = authHeader.split(' ');
  if (partes.length !== 2 || partes[0] !== 'Bearer') {
    return res
      .status(401)
      .json({ ok: false, mensaje: 'Formato de token inválido. Usa: Bearer <token>.' });
  }

  try {
    const resultado = authService.verificarToken(partes[1]);
    req.usuario = resultado.usuario;
    return next();
  } catch (error) {
    return res
      .status(error.codigo || 401)
      .json({ ok: false, mensaje: error.mensaje || 'Token inválido.' });
  }
}

function soloAdmin(req, res, next) {
  if (req.usuario && req.usuario.rol === 'admin') {
    return next();
  }
  return res
    .status(403)
    .json({ ok: false, mensaje: 'Acceso restringido a administradores.' });
}

module.exports = { verificar, soloAdmin };
