# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## CI/CD del frontend

El workflow instala con `npm ci` y compila en cada push a `main` y pull request hacia `main`.

La publicacion se inicia manualmente desde Actions > Frontend CI/CD > Run workflow, seleccionando `main` y activando `deploy`. Por defecto los pushes solo compilan, para conservar la prueba mientras se prepara el backend real. Cuando ambos repositorios esten listos, `AUTO_DEPLOY=true` activa la publicacion automatica de pushes a `main`.

Configura en Settings > Secrets and variables > Actions estos secretos para este repositorio real (no se heredan del repositorio de prueba): `SSH_HOST`, `SSH_PORT`, `SSH_USER`, `SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS`.

Configura estas variables de repositorio:

| Variable | Valor para el grupo |
| --- | --- |
| `DEPLOY_PATH` | `/home/grupo18sa/proyecto2/frontend` |
| `VITE_API_URL` | `https://www.tecnoweb.org.bo/inf513/grupo18sa/proyecto2` |
| `VITE_BASE_PATH` | `/inf513/grupo18sa/proyecto2/` |
| `AUTO_DEPLOY` | `false` inicialmente; `true` para publicar automaticamente los pushes a main |

`VITE_API_URL` no lleva `/api` ni `/api/v1`: `src/api/cliente.js` agrega `/api/v1`. Estas variables son publicas y se incorporan al JavaScript compilado. No contienen credenciales de PostgreSQL. La compilacion usa las variables del repositorio, no solo las del entorno `production`.

El router utiliza la base de Vite. El `.htaccess` permite abrir o recargar rutas como `/proyecto2/iniciar-sesion`, conserva los archivos existentes y envia `/api` al gateway PHP del backend. Requiere Apache 2.4 con mod_rewrite y AllowOverride.

El despliegue exige que `/api/v1/publico/facultades` de la API real responda correctamente antes de cambiar el frontend. Se debe desplegar y configurar el backend real primero. El workflow conserva `releases` previos y cambia el enlace `current`; no elimina la version de prueba ni toca la base de datos. Volver al codigo anterior no revierte cambios de base de datos.

Las reglas publicas de Apache deben mantenerse coordinadas entre los dos repositorios: si el backend publica su `.htaccess`, tambien debe incluir el fallback a `index.html` de este proyecto.
