// Muestra cuántos productos y usuarios hay, y solo los primeros
// caracteres del hash (nunca la contraseña).
require('dotenv').config();

const database = require('../src/config/database');

const estado = database.leer();

console.log('Archivo:', database.DB_PATH);
console.log('');

console.log(`Usuarios (${estado.usuarios.length}):`);
estado.usuarios.forEach((usuario) => {
  console.log(
    `  - ${usuario.usuario} (rol: ${usuario.rol}) hash: ${String(
      usuario.passwordHash
    ).slice(0, 10)}...`
  );
});

console.log('');
console.log(`Productos (${estado.productos.length}):`);
estado.productos.forEach((producto) => {
  console.log(
    `  - [${producto.id}] ${producto.nombre} | $${producto.precio} | stock: ${producto.stock} | categoría: ${
      producto.categoria || '-'
    }`
  );
});
