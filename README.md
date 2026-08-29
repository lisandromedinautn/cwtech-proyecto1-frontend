# Distribuidora BV - Sistema de Gestión

## Demo

https://cwtech1.vercel.app/

## Backend

https://proyecto1-back-pa-doglio-falchi-fermani-1hri.onrender.com/

Backend para el sistema de gestión integral de una distribuidora. Construido con NestJS, TypeScript y MySQL, siguiendo una arquitectura modular con patrones de diseño orientados al dominio.

# Proyecto1-Front

## Tecnologías utilizadas

- **React 19** + **TypeScript**
- **Vite 6** como bundler y servidor de desarrollo
- **React Router DOM** para el ruteo
- **Tailwind CSS** para estilos, con **shadcn/ui** y **Radix UI** como base de componentes
- **Jotai** para manejo de estado
- **React Hook Form** + **Yup** para formularios y validaciones
- **Axios** para las peticiones HTTP
- **AG Grid** para tablas de datos
- **Recharts** para gráficos
- **Framer Motion** para animaciones
- **Lucide React** y **Heroicons** para íconos
- **Google OAuth** (`@react-oauth/google`) y **Facebook Login** (`@greatsumini/react-facebook-login`) para autenticación
- **ESLint** + **Prettier** para linting y formateo de código
- **Docker** para contenerización
- **Vercel** para despliegue

## Estructura de directorios

```
src/
├── assets/            # Imágenes y recursos estáticos
├── componentes/        # Componentes de React, organizados por módulo de negocio
│   ├── gestion-organizacion/  # Clientes, proveedores, personal, localidades, etc.
│   ├── gestion-producto/      # Productos, líneas, marcas, precios
│   ├── gestion-usuario/       # Gestión de usuarios
│   ├── herramientas/          # Componentes utilitarios (alertas, tablas, formateo, etc.)
│   ├── menu/                  # Menú de navegación
│   ├── NotificacionModal/     # Modal de notificaciones (con sus hooks, interfaces y services)
│   ├── sistema/                # Componentes del sistema
│   └── ui/                     # Componentes de UI base (shadcn/ui)
├── config/             # Configuración general de la app
├── context/            # Contextos de React
├── hooks/              # Custom hooks
├── interfaces/          # Tipos e interfaces de TypeScript, organizados por módulo
├── pages/              # Páginas / vistas de la aplicación
├── utils/              # Funciones utilitarias
├── App.tsx             # Componente raíz
├── main.tsx            # Punto de entrada de la app
└── index.css / App.css # Estilos globales
```

## Cómo levantar el proyecto

### Requisitos previos

- [Node.js](https://nodejs.org/) 20 o superior
- [Yarn](https://yarnpkg.com/) (el proyecto incluye `yarn.lock`)

### Instalación

```bash
yarn install
```

### Variables de entorno

El proyecto usa un archivo `.env.development` con la URL de la API:

```
VITE_API_URL="http://localhost:3000/api"
```

Ajustar este valor según donde esté corriendo el backend.

### Modo desarrollo

```bash
yarn dev
```

Esto levanta el servidor de Vite en modo desarrollo (por defecto en `http://localhost:5173`).

### Build de producción

```bash
yarn build
```

### Previsualizar el build

```bash
yarn preview
```

### Linter

```bash
yarn lint
```

### Con Docker

También se puede levantar el proyecto usando el `Dockerfile` incluido:

```bash
docker build -t proyecto1-front .
docker run -p 5173:5173 proyecto1-front
```
