import { describe, expect, it } from 'vitest';
import { collectiviteTypeEnum } from '../../collectivites';
import {
  getPerimetreInstructeur,
  getTitresAvisInstructeur,
  isTypeInstructeur,
  PerimetreInstructeurEnum,
  peutDeposerAvisInstructeur,
  typesInstructeur,
  typesInstructeurDeposantAvis,
} from './pcaet-instructeur.rules';

describe('typesInstructeur', () => {
  it('holds the five bodies a transmitted dossier reaches', () => {
    expect(typesInstructeur).toEqual([
      collectiviteTypeEnum.DREAL,
      collectiviteTypeEnum.REGION,
      collectiviteTypeEnum.DDT,
      collectiviteTypeEnum.DR_ADEME,
      collectiviteTypeEnum.SERVICE_NATIONAL,
    ]);
  });
});

describe('isTypeInstructeur', () => {
  it('accepts the five bodies a dossier reaches', () => {
    expect(isTypeInstructeur(collectiviteTypeEnum.DREAL)).toBe(true);
    expect(isTypeInstructeur(collectiviteTypeEnum.REGION)).toBe(true);
    expect(isTypeInstructeur(collectiviteTypeEnum.DDT)).toBe(true);
    expect(isTypeInstructeur(collectiviteTypeEnum.DR_ADEME)).toBe(true);
    expect(isTypeInstructeur(collectiviteTypeEnum.SERVICE_NATIONAL)).toBe(true);
  });

  it('rejects the other collectivite types', () => {
    expect(isTypeInstructeur(collectiviteTypeEnum.EPCI)).toBe(false);
    expect(isTypeInstructeur(collectiviteTypeEnum.COMMUNE)).toBe(false);
    expect(isTypeInstructeur(collectiviteTypeEnum.TEST)).toBe(false);
  });
});

describe('getPerimetreInstructeur', () => {
  it('a dreal, a region and a dr ademe cover their region', () => {
    const region = PerimetreInstructeurEnum.REGION;
    expect(getPerimetreInstructeur(collectiviteTypeEnum.DREAL)).toBe(region);
    expect(getPerimetreInstructeur(collectiviteTypeEnum.REGION)).toBe(region);
    expect(getPerimetreInstructeur(collectiviteTypeEnum.DR_ADEME)).toBe(region);
  });

  it('a ddt covers its department only', () => {
    expect(getPerimetreInstructeur(collectiviteTypeEnum.DDT)).toBe(
      PerimetreInstructeurEnum.DEPARTEMENT
    );
  });

  /**
   * Le périmètre qui ne se compare à aucun code géographique : un service
   * national voit tout, il n'y a pas de colonne à confronter à la déposante.
   */
  it('a national service covers the whole country', () => {
    expect(getPerimetreInstructeur(collectiviteTypeEnum.SERVICE_NATIONAL)).toBe(
      PerimetreInstructeurEnum.NATIONAL
    );
  });

  it('returns undefined for a type that cannot instruct', () => {
    expect(getPerimetreInstructeur(collectiviteTypeEnum.EPCI)).toBeUndefined();
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

  /** Les trois autres reçoivent le dossier pour lecture : aucun titre à rendre. */
  it('a ddt, a dr ademe and a national service carry none', () => {
    expect(getTitresAvisInstructeur(collectiviteTypeEnum.DDT)).toEqual([]);
    expect(getTitresAvisInstructeur(collectiviteTypeEnum.DR_ADEME)).toEqual([]);
    expect(
      getTitresAvisInstructeur(collectiviteTypeEnum.SERVICE_NATIONAL)
    ).toEqual([]);
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
   * Les destinataires en lecture ne comptent pas dans `avisTousRendus` : sinon
   * aucune instruction ne se clôturerait jamais.
   */
  it('a ddt, a dr ademe and a national service only read the dossier', () => {
    expect(peutDeposerAvisInstructeur(collectiviteTypeEnum.DDT)).toBe(false);
    expect(peutDeposerAvisInstructeur(collectiviteTypeEnum.DR_ADEME)).toBe(
      false
    );
    expect(
      peutDeposerAvisInstructeur(collectiviteTypeEnum.SERVICE_NATIONAL)
    ).toBe(false);
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
