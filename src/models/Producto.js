// Documentación del esquema de producto (no es una clase obligatoria).
module.exports = {
  coleccion: 'productos',
  camposObligatorios: ['nombre', 'precio', 'stock'],
  reglas: {
    nombre: 'No puede estar vacío.',
    precio: 'Debe ser un número mayor que 0.',
    stock: 'Debe ser un entero mayor o igual a 0.',
  },
};
