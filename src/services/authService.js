// Servicio de autenticación: no conoce req/res, solo reglas de negocio.
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const jwtConfig = require('../config/jwt');
const database = require('../config/database');

function normalizarUsuario(usuario) {
  return String(usuario || '').trim();
}

// Login: valida que lleguen los datos, busca el usuario, compara con bcrypt
// y firma el JWT con { id, usuario, rol }.
async function autenticar(usuario, contrasena) {
  if (!normalizarUsuario(usuario)) {
    throw { codigo: 400, mensaje: 'El usuario es obligatorio.' };
  }
  if (contrasena === undefined || contrasena === null || String(contrasena) === '') {
    throw { codigo: 400, mensaje: 'La contraseña es obligatoria.' };
  }

  const buscado = normalizarUsuario(usuario);
  const encontrado = database.leer().usuarios.find((u) => u.usuario === buscado);

  // Mismo mensaje para usuario inexistente y contraseña incorrecta:
  // no se revela cuál de las dos falló.
  if (!encontrado) {
    throw { codigo: 401, mensaje: 'Credenciales incorrectas.' };
  }

  const coincide = await bcrypt.compare(String(contrasena), encontrado.passwordHash);
  if (!coincide) {
    throw { codigo: 401, mensaje: 'Credenciales incorrectas.' };
  }

  const token = jwt.sign(
    { id: encontrado.id, usuario: encontrado.usuario, rol: encontrado.rol },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn, algorithm: jwtConfig.algorithm }
  );

  return {
    token,
    usuario: {
      id: encontrado.id,
      usuario: encontrado.usuario,
      rol: encontrado.rol,
      creadoEn: encontrado.creadoEn,
    },
  };
}

// Verifica un token JWT y devuelve el payload decodificado.
function verificarToken(token) {
  try {
    const decoded = jwt.verify(token, jwtConfig.secret, {
      algorithms: [jwtConfig.algorithm],
    });
    return { valido: true, usuario: decoded };
  } catch (error) {
    if (error && error.name === 'TokenExpiredError') {
      throw { codigo: 401, mensaje: 'El token ha expirado.' };
    }
    throw { codigo: 401, mensaje: 'Token inválido.' };
  }
}

// Cambio de contraseña: exige la actual, mínimo 6 caracteres y distinta.
async function cambiarContrasena(id, { contrasenaActual, contrasenaNueva }) {
  if (!contrasenaActual || !contrasenaNueva) {
    throw { codigo: 400, mensaje: 'La contraseña actual y la nueva son obligatorias.' };
  }
  if (String(contrasenaNueva).length < 6) {
    throw { codigo: 400, mensaje: 'La nueva contraseña debe tener mínimo 6 caracteres.' };
  }
  if (String(contrasenaNueva) === String(contrasenaActual)) {
    throw { codigo: 400, mensaje: 'La nueva contraseña debe ser distinta de la actual.' };
  }

  const estado = database.leer();
  const encontrado = estado.usuarios.find((u) => u.id === id);
  if (!encontrado) {
    throw { codigo: 404, mensaje: 'Usuario no encontrado.' };
  }

  const coincide = await bcrypt.compare(String(contrasenaActual), encontrado.passwordHash);
  if (!coincide) {
    throw { codigo: 400, mensaje: 'La contraseña actual es incorrecta.' };
  }

  encontrado.passwordHash = bcrypt.hashSync(String(contrasenaNueva), 10);
  database.escribir(estado);

  return true;
}

module.exports = { autenticar, verificarToken, cambiarContrasena };
