import { describe, expect, it } from 'vitest';
import { FILTROS_INICIALES, getFiltrosInicialesPorModulo } from './filtros-iniciales';

describe('getFiltrosInicialesPorModulo', () => {
  it('devuelve el default para consultar-producto', () => {
    expect(getFiltrosInicialesPorModulo('consultar-producto')).toEqual(FILTROS_INICIALES['consultar-producto']);
  });

  it('no reemplaza el estado cuando el modulo no tiene config', () => {
    expect(getFiltrosInicialesPorModulo(undefined)).toBeUndefined();
    expect(getFiltrosInicialesPorModulo('modulo-desconocido' as any)).toBeUndefined();
  });
});
