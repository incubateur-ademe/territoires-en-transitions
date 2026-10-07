import { describe, expect, it } from 'vitest';
import {
  LEVIER_NOM_BY_ID,
  LEVIER_SECTEURS,
  LevierId,
  levierEnumValues,
  levierIdEnumValues,
} from './levier.enum';

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

const foldAccents = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const significantTokensOf = (levierId: LevierId): string[] =>
  levierId.split('_').filter((token) => token.length > 3);

describe('LEVIER_NOM_BY_ID', () => {
  it('nomme chaque identifiant par un libellé qui en reprend les mots', () => {
    const mismatches = levierIdEnumValues.flatMap((levierId) => {
      const nom = foldAccents(LEVIER_NOM_BY_ID[levierId]);
      const absents = significantTokensOf(levierId).filter(
        (token) => !nom.includes(token.slice(0, 5))
      );
      return absents.length > 0 ? [{ levierId, absents }] : [];
    });

    expect(mismatches).toEqual([]);
  });
});
