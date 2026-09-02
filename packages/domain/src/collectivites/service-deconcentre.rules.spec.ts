import { describe, expect, it } from 'vitest';
import { collectiviteTypeEnum } from './collectivite-type.enum';
import {
  isServiceDeconcentre,
  servicesDeconcentresTypes,
} from './service-deconcentre.rules';

describe('servicesDeconcentresTypes', () => {
  it('holds the state services that have no standard space of their own', () => {
    expect(servicesDeconcentresTypes).toEqual([
      collectiviteTypeEnum.DREAL,
      collectiviteTypeEnum.DDT,
      collectiviteTypeEnum.DR_ADEME,
      collectiviteTypeEnum.SERVICE_NATIONAL,
    ]);
  });
});

describe('isServiceDeconcentre', () => {
  it('accepts the four state services', () => {
    expect(isServiceDeconcentre(collectiviteTypeEnum.DREAL)).toBe(true);
    expect(isServiceDeconcentre(collectiviteTypeEnum.DDT)).toBe(true);
    expect(isServiceDeconcentre(collectiviteTypeEnum.DR_ADEME)).toBe(true);
    expect(isServiceDeconcentre(collectiviteTypeEnum.SERVICE_NATIONAL)).toBe(
      true
    );
  });

  it('rejects the other collectivite types, including region', () => {
    expect(isServiceDeconcentre(collectiviteTypeEnum.EPCI)).toBe(false);
    expect(isServiceDeconcentre(collectiviteTypeEnum.COMMUNE)).toBe(false);
    expect(isServiceDeconcentre(collectiviteTypeEnum.PREFECTURE_REGION)).toBe(
      false
    );
  });

  /**
   * Le point qui coûterait cher à casser : un conseil régional instruit les
   * dossiers de sa région, mais reste une collectivité à part entière. Le
   * marquer service déconcentré le renverrait hors de ses propres plans.
   */
  it('keeps a region out, even though it instructs', () => {
    expect(isServiceDeconcentre(collectiviteTypeEnum.REGION)).toBe(false);
  });
});
