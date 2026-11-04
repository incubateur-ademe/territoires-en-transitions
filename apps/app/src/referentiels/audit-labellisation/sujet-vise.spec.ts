import { SujetDemandeEnum } from '@tet/domain/referentiels';
import { describe, expect, it } from 'vitest';
import { isLabellisationVisee, toSujetVise } from './sujet-vise';

describe('toSujetVise', () => {
  it("vise une labellisation simple pour une collectivité non COT, quel que soit le type d'audit COT retenu", () => {
    expect(
      toSujetVise({ isCOT: false, sujetCotVise: SujetDemandeEnum.COT })
    ).toBe(SujetDemandeEnum.LABELLISATION);
  });

  it("vise l'audit COT sans labellisation quand une collectivité COT le choisit", () => {
    expect(
      toSujetVise({ isCOT: true, sujetCotVise: SujetDemandeEnum.COT })
    ).toBe(SujetDemandeEnum.COT);
  });

  it("vise l'audit COT avec labellisation quand une collectivité COT le choisit", () => {
    expect(
      toSujetVise({
        isCOT: true,
        sujetCotVise: SujetDemandeEnum.LABELLISATION_COT,
      })
    ).toBe(SujetDemandeEnum.LABELLISATION_COT);
  });
});

describe('isLabellisationVisee', () => {
  it("ne vise pas de labellisation pour l'audit COT seul", () => {
    expect(isLabellisationVisee(SujetDemandeEnum.COT)).toBe(false);
  });

  it('vise une labellisation pour les deux autres sujets', () => {
    expect(isLabellisationVisee(SujetDemandeEnum.LABELLISATION)).toBe(true);
    expect(isLabellisationVisee(SujetDemandeEnum.LABELLISATION_COT)).toBe(true);
  });
});
