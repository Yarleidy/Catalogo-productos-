// Controlador de autenticación: traduce HTTP <-> authService.
const authService = require('../services/authService');

async function login(req, res, next) {
  try {
    const cuerpo = req.body || {};
    const usuario = cuerpo.usuario;

    // Se acepta la clave "contraseña" (con ñ) o "contrasena".
    const contrasena =
      cuerpo['contraseña'] !== undefined ? cuerpo['contraseña'] : cuerpo.contrasena;

    const resultado = await authService.autenticar(usuario, contrasena);
    res.json({
      ok: true,
      mensaje: 'Sesión iniciada.',
      token: resultado.token,
      usuario: resultado.usuario,
    });
  } catch (error) {
    next(error);
  }
}

async function cambiarContrasena(req, res, next) {
  try {
    const cuerpo = req.body || {};
    const contrasenaActual =
      cuerpo['contraseñaActual'] !== undefined
        ? cuerpo['contraseñaActual']
        : cuerpo.contrasenaActual;
    const contrasenaNueva =
      cuerpo['contraseñaNueva'] !== undefined
        ? cuerpo['contraseñaNueva']
        : cuerpo.contrasenaNueva;

    await authService.cambiarContrasena(req.usuario.id, {
      contrasenaActual,
      contrasenaNueva,
    });

    res.json({ ok: true, mensaje: 'Contraseña actualizada.' });
  } catch (error) {
    next(error);
  }
}

module.exports = { login, cambiarContrasena };
