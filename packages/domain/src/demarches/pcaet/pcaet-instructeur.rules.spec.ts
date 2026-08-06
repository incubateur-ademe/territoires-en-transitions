import { describe, expect, it } from 'vitest';
import { collectiviteTypeEnum } from '../../collectivites';
import {
  getCleGeoInstructeur,
  isTypeInstructeur,
  typesInstructeur,
} from './pcaet-instructeur.rules';

describe('typesInstructeur', () => {
  it('only the dreal type can instruct in v1', () => {
    expect(typesInstructeur).toEqual([collectiviteTypeEnum.DREAL]);
  });
});

describe('isTypeInstructeur', () => {
  it('accepts a dreal', () => {
    expect(isTypeInstructeur(collectiviteTypeEnum.DREAL)).toBe(true);
  });

  it('rejects the other collectivite types, including region', () => {
    expect(isTypeInstructeur(collectiviteTypeEnum.EPCI)).toBe(false);
    expect(isTypeInstructeur(collectiviteTypeEnum.COMMUNE)).toBe(false);
    expect(isTypeInstructeur(collectiviteTypeEnum.REGION)).toBe(false);
    expect(isTypeInstructeur(collectiviteTypeEnum.TEST)).toBe(false);
  });
});

describe('getCleGeoInstructeur', () => {
  it('a dreal covers its region', () => {
    expect(getCleGeoInstructeur(collectiviteTypeEnum.DREAL)).toBe('regionCode');
  });

  it('returns undefined for a type that cannot instruct', () => {
    expect(getCleGeoInstructeur(collectiviteTypeEnum.EPCI)).toBeUndefined();
  });
});
