import { describe, expect, it } from 'vitest';
import { collectiviteTypeEnum } from './collectivite-type.enum';
import {
  isServiceDeconcentre,
  servicesDeconcentresTypes,
} from './service-deconcentre.rules';

describe('servicesDeconcentresTypes', () => {
  it('only the dreal type is a service deconcentre in v1', () => {
    expect(servicesDeconcentresTypes).toEqual([collectiviteTypeEnum.DREAL]);
  });
});

describe('isServiceDeconcentre', () => {
  it('accepts a dreal', () => {
    expect(isServiceDeconcentre(collectiviteTypeEnum.DREAL)).toBe(true);
  });

  it('rejects the other collectivite types, including region', () => {
    expect(isServiceDeconcentre(collectiviteTypeEnum.EPCI)).toBe(false);
    expect(isServiceDeconcentre(collectiviteTypeEnum.COMMUNE)).toBe(false);
    expect(isServiceDeconcentre(collectiviteTypeEnum.REGION)).toBe(false);
    expect(isServiceDeconcentre(collectiviteTypeEnum.PREFECTURE_REGION)).toBe(
      false
    );
  });
});
