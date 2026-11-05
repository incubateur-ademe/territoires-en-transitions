import { SujetDemandeEnum } from '@tet/domain/referentiels';
import { describe, expect, it } from 'vitest';
import { toDemandeVisee, toSendDemandeInput } from './demande-visee';

const CIBLE = { collectiviteId: 7, referentiel: 'cae' } as const;

describe('toDemandeVisee', () => {
  it("vise l'audit COT seul quelle que soit l'étoile choisie avant de désactiver la labellisation", () => {
    expect(
      toDemandeVisee({ sujetVise: SujetDemandeEnum.COT, etoile: 3 })
    ).toEqual({ kind: 'audit-cot' });
  });

  it('vise la première étoile déclarative quand la première étoile est choisie', () => {
    expect(
      toDemandeVisee({ sujetVise: SujetDemandeEnum.LABELLISATION, etoile: 1 })
    ).toEqual({
      kind: 'premiere-etoile',
      sujet: SujetDemandeEnum.LABELLISATION,
    });
  });

  it("vise un audit de labellisation dès la deuxième étoile, en gardant le sujet COT d'une collectivité COT", () => {
    expect(
      toDemandeVisee({
        sujetVise: SujetDemandeEnum.LABELLISATION_COT,
        etoile: 2,
      })
    ).toEqual({
      kind: 'audit-labellisation',
      sujet: SujetDemandeEnum.LABELLISATION_COT,
      etoile: 2,
    });
  });
});

describe('toSendDemandeInput', () => {
  it("n'envoie aucune étoile pour l'audit COT seul", () => {
    expect(toSendDemandeInput(CIBLE, { kind: 'audit-cot' })).toEqual({
      ...CIBLE,
      sujet: SujetDemandeEnum.COT,
      etoiles: null,
    });
  });

  it("envoie la première étoile avec le sujet COT d'une collectivité COT", () => {
    expect(
      toSendDemandeInput(CIBLE, {
        kind: 'premiere-etoile',
        sujet: SujetDemandeEnum.LABELLISATION_COT,
      })
    ).toEqual({
      ...CIBLE,
      sujet: SujetDemandeEnum.LABELLISATION_COT,
      etoiles: 1,
    });
  });

  it("envoie l'étoile choisie pour un audit de labellisation", () => {
    expect(
      toSendDemandeInput(CIBLE, {
        kind: 'audit-labellisation',
        sujet: SujetDemandeEnum.LABELLISATION,
        etoile: 4,
      })
    ).toEqual({
      ...CIBLE,
      sujet: SujetDemandeEnum.LABELLISATION,
      etoiles: 4,
    });
  });
});
