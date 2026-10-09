import { describe, expect, it } from 'vitest';
import {
  isPcaetDiagnosticVulnerabiliteComplete,
  isVulnerabiliteLigneComplete,
  isVulnerabiliteObjectifRequis,
} from './demarche-pcaet-vulnerabilite.rules';
import type {
  DemarchePcaetVulnerabiliteLigne,
  DemarchePcaetVulnerabiliteThematique,
} from './demarche-pcaet-vulnerabilite.schema';

const ligne = (
  overrides: Partial<DemarchePcaetVulnerabiliteLigne> = {}
): DemarchePcaetVulnerabiliteLigne => ({
  thematiqueId: 1,
  niveauMaintenant: null,
  niveau2050: null,
  niveau2100: null,
  objectifs2050: null,
  objectifs2100: null,
  ...overrides,
});

const thematique = (
  overrides: Partial<DemarchePcaetVulnerabiliteThematique> = {}
): DemarchePcaetVulnerabiliteThematique => ({
  id: 1,
  code: 'eau',
  label: 'Eau',
  parentId: null,
  requis: true,
  isSocle: true,
  ...overrides,
});

describe('isVulnerabiliteObjectifRequis', () => {
  it('n’exige un objectif que si le territoire est concerné', () => {
    expect(isVulnerabiliteObjectifRequis('faible')).toBe(true);
    expect(isVulnerabiliteObjectifRequis('fort')).toBe(true);
    expect(isVulnerabiliteObjectifRequis('non_concerne')).toBe(false);
    expect(isVulnerabiliteObjectifRequis(null)).toBe(false);
  });
});

describe('isVulnerabiliteLigneComplete', () => {
  const complete = ligne({
    niveauMaintenant: 'faible',
    niveau2050: 'moyen',
    niveau2100: 'fort',
    objectifs2050: 'Réduire de 25 % la consommation d’eau potable',
    objectifs2100: 'Sécuriser la ressource',
  });

  it('accepte une ligne dont les trois horizons sont tranchés et motivés', () => {
    expect(isVulnerabiliteLigneComplete(complete)).toBe(true);
  });

  it('refuse un horizon non renseigné', () => {
    expect(
      isVulnerabiliteLigneComplete({ ...complete, niveauMaintenant: null })
    ).toBe(false);
    expect(
      isVulnerabiliteLigneComplete({ ...complete, niveau2100: null })
    ).toBe(false);
  });

  it('refuse un objectif manquant sur un horizon concerné', () => {
    expect(
      isVulnerabiliteLigneComplete({ ...complete, objectifs2050: null })
    ).toBe(false);
  });

  it('refuse un objectif réduit à des espaces', () => {
    expect(
      isVulnerabiliteLigneComplete({ ...complete, objectifs2100: '   ' })
    ).toBe(false);
  });

  it('dispense d’objectif l’horizon « non concerné »', () => {
    expect(
      isVulnerabiliteLigneComplete({
        ...complete,
        niveau2050: 'non_concerne',
        objectifs2050: null,
      })
    ).toBe(true);
  });
});

describe('isPcaetDiagnosticVulnerabiliteComplete', () => {
  const nonConcernee = (
    thematiqueId: number
  ): DemarchePcaetVulnerabiliteLigne =>
    ligne({
      thematiqueId,
      niveauMaintenant: 'non_concerne',
      niveau2050: 'non_concerne',
      niveau2100: 'non_concerne',
    });

  it('exige une ligne complète pour chaque thématique requise', () => {
    expect(
      isPcaetDiagnosticVulnerabiliteComplete({
        thematiques: [
          thematique(),
          thematique({ id: 2, code: 'foret', label: 'Forêt' }),
        ],
        lignes: [nonConcernee(1)],
      })
    ).toBe(false);
  });

  it('n’exige rien des thématiques ajoutées par la collectivité', () => {
    expect(
      isPcaetDiagnosticVulnerabiliteComplete({
        thematiques: [
          thematique(),
          thematique({
            id: 2,
            code: null,
            label: 'Zones humides',
            requis: false,
            isSocle: false,
          }),
        ],
        lignes: [nonConcernee(1)],
      })
    ).toBe(true);
  });

  it('déclare complet un socle intégralement déclaré « non concerné »', () => {
    expect(
      isPcaetDiagnosticVulnerabiliteComplete({
        thematiques: [
          thematique(),
          thematique({ id: 2, code: 'foret', label: 'Forêt' }),
        ],
        lignes: [nonConcernee(1), nonConcernee(2)],
      })
    ).toBe(true);
  });
});
