import { describe, expect, it } from 'vitest';
import { collectiviteTypeEnum } from '../../collectivites';
import {
  getCleGeoInstructeur,
  getTitresAvisInstructeur,
  isTypeInstructeur,
  peutDeposerAvisInstructeur,
  typesInstructeur,
  typesInstructeurDeposantAvis,
} from './pcaet-instructeur.rules';

describe('typesInstructeur', () => {
  it('holds the three bodies a transmitted dossier reaches', () => {
    expect(typesInstructeur).toEqual([
      collectiviteTypeEnum.DREAL,
      collectiviteTypeEnum.REGION,
      collectiviteTypeEnum.DDT,
    ]);
  });
});

describe('isTypeInstructeur', () => {
  it('accepts a dreal, a region and a ddt', () => {
    expect(isTypeInstructeur(collectiviteTypeEnum.DREAL)).toBe(true);
    expect(isTypeInstructeur(collectiviteTypeEnum.REGION)).toBe(true);
    expect(isTypeInstructeur(collectiviteTypeEnum.DDT)).toBe(true);
  });

  it('rejects the other collectivite types', () => {
    expect(isTypeInstructeur(collectiviteTypeEnum.EPCI)).toBe(false);
    expect(isTypeInstructeur(collectiviteTypeEnum.COMMUNE)).toBe(false);
    expect(isTypeInstructeur(collectiviteTypeEnum.TEST)).toBe(false);
  });
});

describe('getCleGeoInstructeur', () => {
  it('a dreal and a region cover their region', () => {
    expect(getCleGeoInstructeur(collectiviteTypeEnum.DREAL)).toBe('regionCode');
    expect(getCleGeoInstructeur(collectiviteTypeEnum.REGION)).toBe(
      'regionCode'
    );
  });

  it('a ddt covers its department only', () => {
    expect(getCleGeoInstructeur(collectiviteTypeEnum.DDT)).toBe(
      'departementCode'
    );
  });

  it('returns undefined for a type that cannot instruct', () => {
    expect(getCleGeoInstructeur(collectiviteTypeEnum.EPCI)).toBeUndefined();
  });
});

describe('getTitresAvisInstructeur', () => {
  /**
   * Les trois avis du code de l'environnement se répartissent entre deux
   * émetteurs : la DREAL porte les deux titres de l'État, le conseil régional
   * celui de son président.
   */
  it('a dreal carries both state titles', () => {
    expect(getTitresAvisInstructeur(collectiviteTypeEnum.DREAL)).toEqual([
      'prefet_region',
      'autorite_environnementale',
    ]);
  });

  it('a region carries its president title', () => {
    expect(getTitresAvisInstructeur(collectiviteTypeEnum.REGION)).toEqual([
      'president_region',
    ]);
  });

  /** La DDT reçoit le dossier pour lecture : aucun titre à rendre. */
  it('a ddt carries none', () => {
    expect(getTitresAvisInstructeur(collectiviteTypeEnum.DDT)).toEqual([]);
  });

  it('returns none for a type that cannot instruct at all', () => {
    expect(getTitresAvisInstructeur(collectiviteTypeEnum.EPCI)).toEqual([]);
  });
});

describe('peutDeposerAvisInstructeur', () => {
  it('the dreal and the region are solicited for an avis', () => {
    expect(peutDeposerAvisInstructeur(collectiviteTypeEnum.DREAL)).toBe(true);
    expect(peutDeposerAvisInstructeur(collectiviteTypeEnum.REGION)).toBe(true);
  });

  /**
   * La DDT reçoit le dossier pour lecture. Sa demande d'avis ne compte donc pas
   * dans `avisTousRendus` : sinon aucune instruction ne se clôturerait jamais.
   */
  it('a ddt only reads the dossier', () => {
    expect(peutDeposerAvisInstructeur(collectiviteTypeEnum.DDT)).toBe(false);
  });

  it('rejects a type that cannot instruct at all', () => {
    expect(peutDeposerAvisInstructeur(collectiviteTypeEnum.EPCI)).toBe(false);
  });
});

describe('typesInstructeurDeposantAvis', () => {
  it('is the subset an avis can emanate from', () => {
    expect(typesInstructeurDeposantAvis).toEqual([
      collectiviteTypeEnum.DREAL,
      collectiviteTypeEnum.REGION,
    ]);
  });
});
