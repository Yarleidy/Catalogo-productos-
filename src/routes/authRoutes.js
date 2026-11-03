const express = require('express');

const authController = require('../controllers/authController');
const { verificar } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', authController.login);
router.put('/password', verificar, authController.cambiarContrasena);

module.exports = router;
