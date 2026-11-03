require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const productoRoutes = require('./routes/productoRoutes');
const authRoutes = require('./routes/authRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const database = require('./config/database');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, mensaje: 'API operativa.', data: database.estado() });
});

app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ ok: false, mensaje: 'Ruta no encontrada.' });
});

app.use(errorHandler);

module.exports = app;
