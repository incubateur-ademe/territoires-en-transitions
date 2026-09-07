import { describe, expect, it } from 'vitest';
import { LEVIER_SECTEURS, levierEnumValues } from './levier.enum';

describe('levierEnumValues', () => {
  it('déclare 29 leviers distincts', () => {
    expect({
      total: levierEnumValues.length,
      distinct: new Set(levierEnumValues).size,
    }).toEqual({ total: 29, distinct: 29 });
  });
});

describe('LEVIER_SECTEURS', () => {
  it('répartit les leviers sur les huit secteurs qui en portent', () => {
    expect(new Set(Object.values(LEVIER_SECTEURS))).toEqual(
      new Set([
        'Résidentiel',
        'Tertiaire',
        'Transports',
        'Agriculture',
        'UTCATF',
        'Industrie',
        'Déchets',
        'Branche énergie',
      ])
    );
  });
});
