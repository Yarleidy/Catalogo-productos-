// Controlador de productos: traduce HTTP <-> productoService.
const productoService = require('../services/productoService');

async function listarProductos(req, res, next) {
  try {
    const data = productoService.listarProductos(req.query);
    res.json({
      ok: true,
      mensaje: 'Productos encontrados.',
      total: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerEstadisticas(req, res, next) {
  try {
    const data = productoService.obtenerEstadisticas();
    res.json({ ok: true, mensaje: 'Estadísticas calculadas.', data });
  } catch (error) {
    next(error);
  }
}

async function obtenerProducto(req, res, next) {
  try {
    const data = productoService.obtenerProductoPorId(req.params.id);

    if (!data) {
      return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado.' });
    }

    res.json({ ok: true, mensaje: 'Producto encontrado.', data });
  } catch (error) {
    next(error);
  }
}

async function crearProducto(req, res, next) {
  try {
    const data = productoService.crearProducto(req.body);
    res.status(201).json({ ok: true, mensaje: 'Producto creado.', data });
  } catch (error) {
    next(error);
  }
}

async function actualizarProducto(req, res, next) {
  try {
    const data = productoService.actualizarProducto(req.params.id, req.body);

    if (!data) {
      return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado.' });
    }

    res.json({ ok: true, mensaje: 'Producto actualizado.', data });
  } catch (error) {
    next(error);
  }
}

async function eliminarProducto(req, res, next) {
  try {
    const eliminado = productoService.eliminarProducto(req.params.id);

    if (!eliminado) {
      return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado.' });
    }

    // 204 sin cuerpo: el cliente sabrá que se eliminó por el código.
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarProductos,
  obtenerEstadisticas,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
};
