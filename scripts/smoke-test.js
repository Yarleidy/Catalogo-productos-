// Prueba automática de humo contra el servidor encendido.
// Uso: iniciar el servidor (npm start o npm run dev) y luego `npm run smoke`.
require('dotenv').config();

const bcrypt = require('bcryptjs');

const database = require('../src/config/database');

const BASE = `http://localhost:${process.env.PORT || 3000}`;
let token = '';
let correctas = 0;
let fallidas = 0;

function registrar(nombre, correcto, detalle = '') {
  if (correcto) {
    correctas += 1;
    console.log(`  [OK]    ${nombre}`);
  } else {
    fallidas += 1;
    console.log(`  [FALLO] ${nombre} ${detalle}`);
  }
}

async function peticion(metodo, ruta, { body, token: usarToken } = {}) {
  const respuesta = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(usarToken ? { Authorization: `Bearer ${usarToken}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const texto = await respuesta.text();
  let cuerpo = null;
  if (texto) {
    try {
      cuerpo = JSON.parse(texto);
    } catch {
      // respuesta 204 u otro cuerpo no JSON
    }
  }

  return { estado: respuesta.status, cuerpo };
}

function normalizar(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

async function main() {
  console.log(`Probando la API en ${BASE}\n`);

  // --- Health check ---
  const salud = await peticion('GET', '/api/health');
  registrar('Health check responde 200', salud.estado === 200);
  registrar('Health informa baseDatos JSON', salud.cuerpo?.data?.baseDatos === 'JSON');

  // --- Login ---
  const loginOk = await peticion('POST', '/api/auth/login', {
    body: { usuario: 'admin', contraseña: '123456' },
  });
  registrar('Login correcto responde 200', loginOk.estado === 200);
  token = loginOk.cuerpo?.token || '';
  registrar('Login devuelve token', Boolean(token));

  const loginMal = await peticion('POST', '/api/auth/login', {
    body: { usuario: 'admin', contraseña: 'incorrecta' },
  });
  registrar('Login incorrecto responde 401', loginMal.estado === 401);

  // --- Listado, búsqueda y estadísticas (públicas) ---
  const lista = await peticion('GET', '/api/productos');
  registrar(
    'Listar productos responde 200 con data',
    lista.estado === 200 && Array.isArray(lista.cuerpo?.data)
  );

  const busqueda = await peticion('GET', '/api/productos?buscar=lap');
  registrar(
    'Búsqueda sin tildes ni mayúsculas',
    busqueda.estado === 200 &&
      Array.isArray(busqueda.cuerpo?.data) &&
      busqueda.cuerpo.data.some((p) => normalizar(p.nombre).includes('lap'))
  );

  const estadisticas = await peticion('GET', '/api/productos/estadisticas');
  registrar(
    'Estadísticas responden 200 con valores',
    estadisticas.estado === 200 &&
      typeof estadisticas.cuerpo?.data?.valorInventario === 'number'
  );

  // --- Protecciones ---
  const sinToken = await peticion('POST', '/api/productos', {
    body: { nombre: 'X', precio: 1, stock: 1 },
  });
  registrar('Crear sin token responde 401', sinToken.estado === 401);

  const tokenInvalido = await peticion('POST', '/api/productos', {
    body: { nombre: 'X', precio: 1, stock: 1 },
    token: 'no-es-un-token',
  });
  registrar('Crear con token inválido responde 401', tokenInvalido.estado === 401);

  // Usuario temporal sin rol admin para comprobar el 403.
  const estadoTemporal = database.leer();
  estadoTemporal.usuarios.push({
    id: 'humo-403',
    usuario: 'humo403',
    passwordHash: bcrypt.hashSync('humo123456', 10),
    rol: 'usuario',
    creadoEn: new Date().toISOString(),
  });
  database.escribir(estadoTemporal);

  const loginHumo = await peticion('POST', '/api/auth/login', {
    body: { usuario: 'humo403', contraseña: 'humo123456' },
  });
  const sinAdmin = await peticion('POST', '/api/productos', {
    body: { nombre: 'X', precio: 1, stock: 1 },
    token: loginHumo.cuerpo?.token,
  });
  registrar('Crear sin rol admin responde 403', sinAdmin.estado === 403);

  // Limpieza del usuario temporal.
  const estadoLimpio = database.leer();
  estadoLimpio.usuarios = estadoLimpio.usuarios.filter((u) => u.usuario !== 'humo403');
  database.escribir(estadoLimpio);

  // --- CRUD completo ---
  const creado = await peticion('POST', '/api/productos', {
    body: {
      nombre: 'Producto de humo',
      descripcion: 'Creado por la prueba automática',
      precio: 99.5,
      categoria: 'Pruebas',
      stock: 3,
    },
    token,
  });
  registrar('Crear con token responde 201', creado.estado === 201 && Boolean(creado.cuerpo?.data?.id));
  const id = creado.cuerpo?.data?.id;

  const precioInvalido = await peticion('POST', '/api/productos', {
    body: { nombre: 'Precio negativo', precio: -5, stock: 1 },
    token,
  });
  registrar('Precio negativo responde 400', precioInvalido.estado === 400);

  const nombreVacio = await peticion('POST', '/api/productos', {
    body: { nombre: '   ', precio: 10, stock: 1 },
    token,
  });
  registrar('Nombre vacío responde 400', nombreVacio.estado === 400);

  const detalle = await peticion('GET', `/api/productos/${id}`);
  registrar('Detalle responde 200', detalle.estado === 200 && detalle.cuerpo?.data?.id === id);

  const inexistente = await peticion('GET', '/api/productos/no-existe');
  registrar('Producto inexistente responde 404', inexistente.estado === 404);

  const actualizado = await peticion('PUT', `/api/productos/${id}`, {
    body: { precio: 150 },
    token,
  });
  registrar(
    'Actualizar responde 200 con el nuevo precio',
    actualizado.estado === 200 && actualizado.cuerpo?.data?.precio === 150
  );

  const actualizacionVacia = await peticion('PUT', `/api/productos/${id}`, {
    body: {},
    token,
  });
  registrar('Actualizar sin campos responde 400', actualizacionVacia.estado === 400);

  const actualizacionInexistente = await peticion('PUT', '/api/productos/no-existe', {
    body: { precio: 1 },
    token,
  });
  registrar('Actualizar inexistente responde 404', actualizacionInexistente.estado === 404);

  const eliminado = await peticion('DELETE', `/api/productos/${id}`, { token });
  registrar('Eliminar responde 204', eliminado.estado === 204);

  const trasEliminar = await peticion('GET', `/api/productos/${id}`);
  registrar('Detalle tras eliminar responde 404', trasEliminar.estado === 404);

  // --- Cambio de contraseña y restauración ---
  const cambio = await peticion('PUT', '/api/auth/password', {
    body: { contrasenaActual: '123456', contrasenaNueva: 'Temporal2026' },
    token,
  });
  registrar('Cambio de contraseña responde 200', cambio.estado === 200);

  const loginTemporal = await peticion('POST', '/api/auth/login', {
    body: { usuario: 'admin', contraseña: 'Temporal2026' },
  });
  registrar('Login con la nueva contraseña', loginTemporal.estado === 200);

  const restauracion = await peticion('PUT', '/api/auth/password', {
    body: { contrasenaActual: 'Temporal2026', contrasenaNueva: '123456' },
    token,
  });
  registrar('Restauración de contraseña responde 200', restauracion.estado === 200);

  // --- Resumen ---
  console.log('');
  console.log(`Resultado: ${correctas} correctas, ${fallidas} fallidas`);
  process.exitCode = fallidas > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error('No se pudo completar la prueba. ¿Está encendido el servidor?', error.message);
  process.exitCode = 1;
});
