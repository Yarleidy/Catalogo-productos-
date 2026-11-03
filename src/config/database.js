// Capa de datos: única responsable de leer y escribir data/catalogo.json
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.resolve(process.env.DB_PATH || './data/catalogo.json');

// El administrador siempre se concentra con bcrypt, nunca en texto plano.
function crearAdmin() {
  return {
    id: 1,
    usuario: (process.env.ADMIN_USER || 'admin').trim(),
    passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || '123456', 10),
    rol: 'admin',
    creadoEn: new Date().toISOString(),
  };
}

// Siembra inicial: un administrador y algunos productos de ejemplo.
function crearEstadoInicial() {
  const ahora = new Date().toISOString();
  return {
    usuarios: [crearAdmin()],
    productos: [
      {
        id: 'prod-001',
        nombre: 'Laptop',
        descripcion: 'Portátil de 14 pulgadas, 16 GB RAM y SSD de 512 GB.',
        precio: 1299.99,
        categoria: 'Computadoras',
        stock: 12,
        createdAt: ahora,
        updatedAt: ahora,
      },
      {
        id: 'prod-002',
        nombre: 'Monitor',
        descripcion: 'Monitor IPS de 27 pulgadas, 75 Hz.',
        precio: 349.99,
        categoria: 'Computadoras',
        stock: 7,
        createdAt: ahora,
        updatedAt: ahora,
      },
      {
        id: 'prod-003',
        nombre: 'Mouse inalámbrico',
        descripcion: 'Mouse óptico con receptor USB.',
        precio: 25.5,
        categoria: 'Accesorios',
        stock: 30,
        createdAt: ahora,
        updatedAt: ahora,
      },
      {
        id: 'prod-004',
        nombre: 'Teclado mecánico',
        descripcion: 'Switches rojos, retroiluminado.',
        precio: 79.9,
        categoria: 'Accesorios',
        stock: 4,
        createdAt: ahora,
        updatedAt: ahora,
      },
      {
        id: 'prod-005',
        nombre: 'Audífonos',
        descripcion: 'Cancelación de ruido activa.',
        precio: 58.75,
        categoria: 'Accesorios',
        stock: 15,
        createdAt: ahora,
        updatedAt: ahora,
      },
    ],
  };
}

function escribir(estado) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(
    DB_PATH,
    `${JSON.stringify(
      { usuarios: estado.usuarios || [], productos: estado.productos || [] },
      null,
      2
    )}\n`,
    'utf8'
  );
}

function leer() {
  if (!fs.existsSync(DB_PATH)) {
    const inicial = crearEstadoInicial();
    escribir(inicial);
    return inicial;
  }

  const texto = fs.readFileSync(DB_PATH, 'utf8').trim();
  const datos = JSON.parse(texto);

  const estado = {
    usuarios: Array.isArray(datos.usuarios) ? datos.usuarios : [],
    productos: Array.isArray(datos.productos) ? datos.productos : [],
  };

  // Si el archivo no tiene usuarios, se recrea el administrador para no perder el acceso.
  if (estado.usuarios.length === 0) {
    estado.usuarios = [crearAdmin()];
    escribir(estado);
  }

  return estado;
}

// Resumen para el health check.
function estado() {
  const datos = leer();
  return {
    baseDatos: 'JSON',
    ruta: DB_PATH,
    usuarios: datos.usuarios.length,
    productos: datos.productos.length,
  };
}

// Borra y vuelve a sembrar la base de datos.
function reiniciar() {
  const inicial = crearEstadoInicial();
  escribir(inicial);
  return inicial;
}

module.exports = { DB_PATH, leer, escribir, estado, reiniciar, crearEstadoInicial };
