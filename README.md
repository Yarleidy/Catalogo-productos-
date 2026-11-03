# Catálogo de productos

API de catálogo con **Node.js + Express + JWT**, almacenamiento en **JSON** y panel de administración en HTML/CSS/JS. Implementada siguiendo `GUIA_IMPLEMENTACION.md`: la lógica y los contratos de la API son estables; el diseño de las pantallas es libre.

## Requisitos

- Node.js 18 o superior
- npm

## Estructura

```
catalogo-productos/
├─ src/
│  ├─ config/        # config.js, jwt.js, database.js (lectura/escritura del JSON)
│  ├─ models/        # documentación de esquemas
│  ├─ services/      # authService.js, productoService.js (reglas de negocio)
│  ├─ controllers/   # traducen HTTP ↔ servicio
│  ├─ routes/        # authRoutes.js, productoRoutes.js
│  ├─ middleware/    # authMiddleware.js (verificar, soloAdmin), errorHandler.js
│  ├─ expressApp.js  # configuración de Express
│  └─ server.js      # arranque
├─ public/           # frontend (login + panel)
├─ scripts/          # reset-db, inspect-db, smoke-test
└─ data/             # data/catalogo.json (se crea sola al iniciar)
```

## Puesta en marcha

```bash
npm install
npm run dev        # o npm start
```

Abrir `http://localhost:3000` (login) y `http://localhost:3000/api/health` (estado).

Credenciales sembradas (.env): usuario `admin`, contraseña `123456`.

## Contrato de la API

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/health` | Público | Estado de la API (`baseDatos: "JSON"`) |
| POST | `/api/auth/login` | Público | Login y token |
| PUT | `/api/auth/password` | JWT | Cambiar contraseña |
| GET | `/api/productos` | Público | Listar y buscar (`?buscar=`, `?categoria=`) |
| GET | `/api/productos/estadisticas` | Público | Indicadores |
| GET | `/api/productos/:id` | Público | Detalle |
| POST | `/api/productos` | JWT + admin | Crear |
| PUT | `/api/productos/:id` | JWT + admin | Actualizar |
| DELETE | `/api/productos/:id` | JWT + admin | Eliminar |

Respuestas con formato `{ ok, mensaje, data }` (204 sin cuerpo al eliminar). Las rutas protegidas usan `Authorization: Bearer <token>`.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Arranca el servidor |
| `npm run dev` | Arranca con nodemon |
| `npm run db:reset` | Borra y resiembra el JSON (admin + productos de ejemplo) |
| `npm run db:inspect` | Cuenta usuarios y productos (sin exponer contraseñas) |
| `npm run smoke` | Prueba automática completa (requiere el servidor encendido) |

## Seguridad

- Contraseñas cifradas con **bcrypt**.
- El login devuelve el **mismo mensaje** si falla el usuario o la contraseña.
- El token JWT se firma con HS256 y expira según `JWT_EXPIRES_IN`.
- El frontend escapa todo texto antes de usar `innerHTML`, y nunca guarda la contraseña en `localStorage`.
- `.env` y los datos generados no van al repositorio (ver `.gitignore`).

## Notas

- La consola del navegador no debe mostrar errores con el flujo completo.
- Para cambiar el diseño (colores, tarjetas, tablas, modales) solo hay que tocar `public/`; el backend no depende de él.

## Publicación

- **Render (recomendado):** montar el repo de GitHub como *Web Service*, start `npm start`, y definir `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_USER`, `ADMIN_PASSWORD` y `DB_PATH` en variables de entorno. En plan free el disco no es persistente: el JSON se re-siembra al reiniciar.
- **Vercel:** servidorless de solo lectura. Ya está incluido el adaptador (`api/index.js` + `vercel.json`); hay que definir además `DB_PATH=/tmp/catalogo.json` en el panel. Los datos se pierden entre instancias, útil solo para demostraciones.

> Nunca subir `.env` al repositorio; las variables se configuran en el panel de la plataforma.
