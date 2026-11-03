// Servicio de productos: validaciones, filtrado y estadísticas.
// No conoce req/res.
const { v4: uuidv4 } = require('uuid');

const database = require('../config/database');

// Búsqueda sin tildes ni mayúsculas.
function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const CAMPOS_ACTUALIZABLES = ['nombre', 'descripcion', 'precio', 'categoria', 'stock'];

function validarNombre(nombre) {
  if (typeof nombre !== 'string' || nombre.trim() === '') {
    throw { codigo: 400, mensaje: 'El nombre no puede estar vacío.' };
  }
  return nombre.trim();
}

function validarPrecio(valor) {
  if (valor === undefined || valor === null || valor === '') {
    throw { codigo: 400, mensaje: 'El precio debe ser un número mayor que 0.' };
  }
  const precio = Number(valor);
  if (Number.isNaN(precio) || precio <= 0) {
    throw { codigo: 400, mensaje: 'El precio debe ser un número mayor que 0.' };
  }
  return precio;
}

function validarStock(valor) {
  if (valor === undefined || valor === null || valor === '') {
    throw { codigo: 400, mensaje: 'El stock debe ser un entero mayor o igual a 0.' };
  }
  const stock = Number(valor);
  if (!Number.isInteger(stock) || stock < 0) {
    throw { codigo: 400, mensaje: 'El stock debe ser un entero mayor o igual a 0.' };
  }
  return stock;
}

// Filtra por texto (nombre, descripción o categoría) y categoría exacta,
// y devuelve ordenado por fecha de creación (más recientes primero).
function listarProductos({ buscar, categoria } = {}) {
  const texto = normalizarTexto(buscar);
  const categoriaBuscada = normalizarTexto(categoria);

  let lista = database.leer().productos;

  if (texto) {
    lista = lista.filter((producto) =>
      [producto.nombre, producto.descripcion, producto.categoria].some((campo) =>
        normalizarTexto(campo).includes(texto)
      )
    );
  }

  if (categoriaBuscada) {
    lista = lista.filter(
      (producto) => normalizarTexto(producto.categoria) === categoriaBuscada
    );
  }

  return lista.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function obtenerProductoPorId(id) {
  return database.leer().productos.find((producto) => producto.id === id) || null;
}

function crearProducto(datos) {
  const nombre = validarNombre(datos && datos.nombre);
  const precio = validarPrecio(datos && datos.precio);
  const stock = validarStock(datos && datos.stock);

  const ahora = new Date().toISOString();
  const nuevo = {
    id: uuidv4(),
    nombre,
    descripcion: datos.descripcion ? String(datos.descripcion).trim() : '',
    precio,
    categoria: datos.categoria ? String(datos.categoria).trim() : '',
    stock,
    createdAt: ahora,
    updatedAt: ahora,
  };

  const estado = database.leer();
  estado.productos.push(nuevo);
  database.escribir(estado);

  return nuevo;
}

// Actualiza solo los campos enviados; exige al menos uno.
function actualizarProducto(id, datos) {
  const estado = database.leer();
  const producto = estado.productos.find((p) => p.id === id);
  if (!producto) {
    return null;
  }

  const cuerpo = datos || {};
  const claves = Object.keys(cuerpo).filter((clave) =>
    CAMPOS_ACTUALIZABLES.includes(clave)
  );

  if (claves.length === 0) {
    throw {
      codigo: 400,
      mensaje: 'Debes enviar al menos un campo para actualizar (nombre, descripción, precio, categoría o stock).',
    };
  }

  if (claves.includes('nombre')) producto.nombre = validarNombre(cuerpo.nombre);
  if (claves.includes('precio')) producto.precio = validarPrecio(cuerpo.precio);
  if (claves.includes('stock')) producto.stock = validarStock(cuerpo.stock);
  if (claves.includes('descripcion')) {
    producto.descripcion = cuerpo.descripcion ? String(cuerpo.descripcion).trim() : '';
  }
  if (claves.includes('categoria')) {
    producto.categoria = cuerpo.categoria ? String(cuerpo.categoria).trim() : '';
  }

  producto.updatedAt = new Date().toISOString();
  database.escribir(estado);

  return producto;
}

// Quita el producto; devuelve null si no existe.
function eliminarProducto(id) {
  const estado = database.leer();
  const indice = estado.productos.findIndex((p) => p.id === id);

  if (indice === -1) {
    return null;
  }

  estado.productos.splice(indice, 1);
  database.escribir(estado);

  return true;
}

function obtenerEstadisticas() {
  const productos = database.leer().productos;

  return {
    totalProductos: productos.length,
    unidadesDisponibles: productos.reduce(
      (total, producto) => total + (Number(producto.stock) || 0),
      0
    ),
    valorInventario: Number(
      productos
        .reduce(
          (total, producto) =>
            total + (Number(producto.precio) || 0) * (Number(producto.stock) || 0),
          0
        )
        .toFixed(2)
    ),
    stockBajo: productos.filter((producto) => (Number(producto.stock) || 0) <= 5).length,
  };
}

module.exports = {
  listarProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  obtenerEstadisticas,
};
