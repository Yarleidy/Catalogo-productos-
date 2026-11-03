// Adaptador para Vercel (serverless): expone la app de Express como función.
// IMPORTANTE: configurar en el panel de Vercel la variable de entorno
// DB_PATH=/tmp/catalogo.json — Vercel tiene el sistema de archivos de solo
// lectura excepto /tmp, y los datos se pierden entre reinicios.
const app = require('../src/expressApp');

module.exports = app;
