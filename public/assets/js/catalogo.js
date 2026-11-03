/* Lógica del frontend.
   El diseño es libre; lo único que no cambia es cómo se habla con la API. */

const TOKEN_KEY = 'token_crud_productos';
const USUARIO_KEY = 'usuario_crud_productos';

/* ---------- Utilidades ---------- */

// Escapa el texto antes de insertarlo con innerHTML.
function escapeHtml(texto) {
  const div = document.createElement('div');
  div.textContent = String(texto ?? '');
  return div.innerHTML;
}

function formatearPrecio(valor) {
  return `$${Number(valor || 0).toFixed(2)}`;
}

function obtenerToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function cerrarSesion() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USUARIO_KEY);
  window.location.href = '/index.html';
}

let temporizadorToast = null;

function mostrarToast(mensaje, tipo = 'exito') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = mensaje;
  toast.className = `toast ${tipo}`;
  clearTimeout(temporizadorToast);
  temporizadorToast = setTimeout(() => toast.classList.add('oculto'), 2800);
}

/* ---------- Login ---------- */

function iniciarLogin() {
  // Si ya hay sesión, ir directo al panel.
  if (obtenerToken()) {
    window.location.href = '/productos.html';
    return;
  }

  const formulario = document.getElementById('formulario-login');
  const mensaje = document.getElementById('mensaje-login');

  function mostrarError(texto) {
    mensaje.textContent = texto;
    mensaje.classList.remove('oculto');
  }

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    mensaje.classList.add('oculto');

    const usuario = document.getElementById('usuario').value.trim();
    const clave = document.getElementById('clave').value;

    if (!usuario || !clave) {
      mostrarError('Completa usuario y contraseña.');
      return;
    }

    try {
      const respuesta = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, contraseña: clave }),
      });

      const datos = await respuesta.json().catch(() => ({}));

      if (respuesta.ok && datos.token) {
        localStorage.setItem(TOKEN_KEY, datos.token);
        localStorage.setItem(USUARIO_KEY, JSON.stringify(datos.usuario));
        window.location.href = '/productos.html';
      } else {
        mostrarError(datos.mensaje || 'No se pudo iniciar sesión.');
      }
    } catch {
      mostrarError('Error de conexión con el servidor.');
    }
  });
}

/* ---------- Panel ---------- */

let idEditando = null;
let temporizadorBusqueda = null;

async function cargarProductos(texto = '') {
  const url = texto
    ? `/api/productos?buscar=${encodeURIComponent(texto)}`
    : '/api/productos';

  const respuesta = await fetch(url);
  if (respuesta.status === 401) {
    cerrarSesion();
    return;
  }

  const datos = await respuesta.json();
  renderProductos(datos.data || []);
}

function renderProductos(productos) {
  const cuerpo = document.getElementById('cuerpo-productos');
  const aviso = document.getElementById('sin-productos');

  if (productos.length === 0) {
    cuerpo.innerHTML = '';
    aviso.classList.remove('oculto');
    return;
  }

  aviso.classList.add('oculto');

  const filas = productos
    .map((producto) => {
      const bajo = Number(producto.stock) <= 5 ? ' stock-bajo stock-origen' : '';
      return `
        <tr data-id="${escapeHtml(producto.id)}">
          <td>
            <strong>${escapeHtml(producto.nombre)}</strong>
            ${producto.descripcion ? `<br /><small>${escapeHtml(producto.descripcion)}</small>` : ''}
          </td>
          <td>${escapeHtml(producto.categoria || '—')}</td>
          <td>${formatearPrecio(producto.precio)}</td>
          <td class="${bajo.trim()}">${Number(producto.stock)}</td>
          <td class="acciones">
            <button class="boton pequeno fantasma" data-accion="editar">Editar</button>
            <button class="boton pequeno peligro" data-accion="eliminar">Eliminar</button>
          </td>
        </tr>`;
    })
    .join('');

  cuerpo.innerHTML = filas;
}

async function cargarEstadisticas() {
  const respuesta = await fetch('/api/productos/estadisticas');
  if (!respuesta.ok) return;

  const datos = await respuesta.json();
  const estadisticas = datos.data || {};

  const tarjetas = [
    { etiqueta: 'Total de productos', numero: estadisticas.totalProductos },
    { etiqueta: 'Unidades disponibles', numero: estadisticas.unidadesDisponibles },
    { etiqueta: 'Valor del inventario', numero: `$${Number(estadisticas.valorInventario || 0).toFixed(2)}` },
    { etiqueta: 'Productos con stock bajo', numero: estadisticas.stockBajo },
  ];

  document.getElementById('estadisticas').innerHTML = tarjetas
    .map(
      (tarjeta) => `
        <article class="tarjeta">
          <p class="numero">${escapeHtml(tarjeta.numero)}</p>
          <p class="etiqueta">${escapeHtml(tarjeta.etiqueta)}</p>
        </article>`
    )
    .join('');
}

async function abrirModal(producto) {
  // Si solo llega el ID, pedir el detalle por la API.
  if (producto && producto.id && producto.nombre === undefined) {
    const detalles = await fetch(`/api/productos/${producto.id}`);
    if (!detalles.ok) {
      mostrarToast('No se pudo cargar el producto.', 'error');
      return;
    }
    producto = (await detalles.json()).data;
  }

  idEditando = producto ? producto.id : null;
  document.getElementById('titulo-modal').textContent = producto
    ? 'Editar producto'
    : 'Nuevo producto';
  document.getElementById('campo-nombre').value = producto ? producto.nombre : '';
  document.getElementById('campo-descripcion').value = producto ? producto.descripcion || '' : '';
  document.getElementById('campo-precio').value = producto ? producto.precio : '';
  document.getElementById('campo-categoria').value = producto ? producto.categoria || '' : '';
  document.getElementById('campo-stock').value = producto ? producto.stock : '';
  document.getElementById('overlay-modal').classList.remove('oculto');
  document.getElementById('campo-nombre').focus();
}

function cerrarModal() {
  document.getElementById('overlay-modal').classList.add('oculto');
  idEditando = null;
}

async function guardarProducto(evento) {
  evento.preventDefault();

  const cuerpo = {
    nombre: document.getElementById('campo-nombre').value.trim(),
    descripcion: document.getElementById('campo-descripcion').value.trim(),
    precio: document.getElementById('campo-precio').value,
    categoria: document.getElementById('campo-categoria').value.trim(),
    stock: document.getElementById('campo-stock').value,
  };

  const url = idEditando ? `/api/productos/${idEditando}` : '/api/productos';
  const metodo = idEditando ? 'PUT' : 'POST';

  try {
    const respuesta = await fetch(url, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${obtenerToken()}`,
      },
      body: JSON.stringify(cuerpo),
    });

    const datos = await respuesta.json().catch(() => ({}));

    if (respuesta.ok) {
      cerrarModal();
      mostrarToast(idEditando ? 'Producto actualizado.' : 'Producto creado.');
      await cargarProductos(document.getElementById('buscador').value.trim());
      await cargarEstadisticas();
    } else if (respuesta.status === 401) {
      cerrarSesion();
    } else {
      mostrarToast(datos.mensaje || 'No se pudo guardar el producto.', 'error');
    }
  } catch {
    mostrarToast('Error de conexión con el servidor.', 'error');
  }
}

async function eliminarProducto(id, nombre) {
  if (!window.confirm(`¿Eliminar el producto "${nombre}"? Esta acción no se puede deshacer.`)) {
    return;
  }

  try {
    const respuesta = await fetch(`/api/productos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${obtenerToken()}` },
    });

    // 204: se eliminó (no trae cuerpo).
    if (respuesta.status === 204) {
      mostrarToast('Producto eliminado.');
      await cargarProductos(document.getElementById('buscador').value.trim());
      await cargarEstadisticas();
    } else if (respuesta.status === 401) {
      cerrarSesion();
    } else {
      const datos = await respuesta.json().catch(() => ({}));
      mostrarToast(datos.mensaje || 'No se pudo eliminar el producto.', 'error');
    }
  } catch {
    mostrarToast('Error de conexión con el servidor.', 'error');
  }
}

function iniciarPanel() {
  // Proteger el panel: sin token, volver al login.
  if (!obtenerToken()) {
    window.location.href = '/index.html';
    return;
  }

  // Mostrar el nombre del usuario autenticado.
  const nombreSpan = document.getElementById('nombre-usuario');
  try {
    const usuario = JSON.parse(localStorage.getItem(USUARIO_KEY) || 'null');
    if (usuario && usuario.usuario) nombreSpan.textContent = usuario.usuario;
  } catch {
    // Sin nombre de usuario, el panel sigue funcionando.
  }

  document.getElementById('boton-salir').addEventListener('click', cerrarSesion);
  document.getElementById('boton-crear').addEventListener('click', () => abrirModal(null));
  document.getElementById('boton-cancelar').addEventListener('click', cerrarModal);
  document.getElementById('overlay-modal').addEventListener('click', (evento) => {
    if (evento.target.id === 'overlay-modal') cerrarModal();
  });
  document.getElementById('formulario-producto').addEventListener('submit', guardarProducto);

  // Buscador con debounce para no pedir al servidor por cada tecla.
  document.getElementById('buscador').addEventListener('input', (evento) => {
    clearTimeout(temporizadorBusqueda);
    const texto = evento.target.value.trim();
    temporizadorBusqueda = setTimeout(() => cargarProductos(texto), 300);
  });

  // Acciones editar/eliminar con delegación de eventos.
  document.getElementById('cuerpo-productos').addEventListener('click', (evento) => {
    const boton = evento.target.closest('button[data-accion]');
    if (!boton) return;

    const fila = boton.closest('tr');
    const id = fila?.dataset?.id;
    const nombre = fila?.querySelector('strong')?.textContent || 'este producto';

    if (boton.dataset.accion === 'editar') {
      abrirModal(id ? { id } : null);
    } else if (boton.dataset.accion === 'eliminar') {
      eliminarProducto(id, nombre);
    }
  });

  cargarProductos();
  cargarEstadisticas();
}

/* ---------- Arranque ---------- */

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('formulario-login')) iniciarLogin();
  if (document.getElementById('panel-productos')) iniciarPanel();
});
