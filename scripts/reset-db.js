// Borra el archivo JSON y vuelve a crear admin + productos de ejemplo.
require('dotenv').config();

const fs = require('fs');
const database = require('../src/config/database');

if (fs.existsSync(database.DB_PATH)) {
  fs.unlinkSync(database.DB_PATH);
}

const estado = database.reiniciar();

console.log('Base de datos reiniciada en:', database.DB_PATH);
console.log('Usuarios:', estado.usuarios.length, '| Productos:', estado.productos.length);
console.log('Administrador sembrado:', estado.usuarios[0].usuario);
