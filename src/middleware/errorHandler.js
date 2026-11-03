// Convierte cualquier error en una respuesta { ok: false, mensaje }.
function errorHandler(error, req, res, _next) {
  // JSON mal formado en el cuerpo de la petición.
  if (error && error.type === 'entity.parse.failed') {
    return res
      .status(400)
      .json({ ok: false, mensaje: 'El cuerpo de la petición no es JSON válido.' });
  }

  const codigo = (error && (error.codigo || error.status)) || 500;
  const mensaje = (error && error.mensaje) || 'Error interno del servidor.';

  if (codigo >= 500 && error) {
    console.error('[errorHandler]', error);
  }

  res.status(codigo).json({ ok: false, mensaje });
}

module.exports = { errorHandler };
