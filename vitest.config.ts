import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'text', 'json-summary'],
      // Meta de PA-037: 70 % sobre producto + utilidades. Si baja, falla `yarn test:cov`.
      thresholds: { statements: 70, lines: 70, functions: 70, branches: 70 },
      // Alcance de la meta del 70 % (PA-037 §5.5): producto + utilidades.
      include: [
        'src/componentes/gestion-producto/**/*.{ts,tsx}',
        'src/utils/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.d.ts',
        // Código muerto de gestion-producto que ningún archivo importa (PA-037 §5.3).
        'src/componentes/gestion-producto/precios/iveco/**',
        'src/componentes/gestion-producto/precios/nex-pro/**',
        'src/componentes/gestion-producto/precios/importaciones/**',
        'src/componentes/gestion-producto/precios/comparacion-importaciones/**',
        'src/componentes/gestion-producto/precios/productos-importacion/**',
        'src/componentes/gestion-producto/precios/**/carga-archivo.tsx',
        'src/componentes/gestion-producto/producto/**/calculo-precio-productos.tsx',
        'src/componentes/gestion-producto/producto/**/registrar-item-proveedor.tsx',
        'src/componentes/gestion-producto/producto/**/registrar-item-prod-alternativo.tsx',
        'src/componentes/gestion-producto/producto/**/use-producto-modales.ts',
        'src/componentes/gestion-producto/producto/**/use-consultar-productos.ts',
        // Código inalcanzable desde main.tsx (verificado con el grafo de imports): ver DecisionTomadaClaude.md.
        'src/componentes/gestion-producto/linea/consultar-linea.tsx',
        'src/componentes/gestion-producto/linea/utils/registrar-item-sublinea.tsx',
        'src/componentes/gestion-producto/linea/interfaces/interfaces-validaciones-sublinea.tsx',
        'src/componentes/gestion-producto/marca/hooks/use-marcas.ts',
        'src/componentes/gestion-producto/marca/hooks/use-marcas-paginacion.ts',
        'src/componentes/gestion-producto/marca/hooks/use-marcas-filtros.ts',
        'src/componentes/gestion-producto/precios/precios-service.tsx',
        'src/componentes/gestion-producto/producto/hooks/use-producto-filtros.ts',
        'src/utils/consultarEntidad.tsx',
        'src/utils/entidad.tsx',
      ],
    },
  },
});
