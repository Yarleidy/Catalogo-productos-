const express = require('express');

const productoController = require('../controllers/productoController');
const { verificar, soloAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Públicas
router.get('/', productoController.listarProductos);
// Importante: declarar /estadisticas antes de /:id, o se interpretará como un ID.
router.get('/estadisticas', productoController.obtenerEstadisticas);
router.get('/:id', productoController.obtenerProducto);

// Protegidas: JWT + rol admin
router.post('/', verificar, soloAdmin, productoController.crearProducto);
router.put('/:id', verificar, soloAdmin, productoController.actualizarProducto);
router.delete('/:id', verificar, soloAdmin, productoController.eliminarProducto);

module.exports = router;
