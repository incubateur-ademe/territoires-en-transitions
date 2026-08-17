import { describe, expect, it } from 'vitest';
import {
  applyNiveauCascade,
  isDemarchePcaetVulnerabiliteComplete,
  isObjectifRequis,
  isVulnerabiliteLigneComplete,
} from './demarche-pcaet-vulnerabilite.rules';
import type {
  DemarchePcaetVulnerabiliteDomaine,
  DemarchePcaetVulnerabiliteLigne,
} from './demarche-pcaet-vulnerabilite.schema';

const ligne = (
  overrides: Partial<DemarchePcaetVulnerabiliteLigne> = {}
): DemarchePcaetVulnerabiliteLigne => ({
  domaineId: 1,
  niveauMaintenant: null,
  niveau2050: null,
  niveau2100: null,
  objectifs2050: null,
  objectifs2100: null,
  ...overrides,
});

const domaine = (
  overrides: Partial<DemarchePcaetVulnerabiliteDomaine> = {}
): DemarchePcaetVulnerabiliteDomaine => ({
  id: 1,
  code: 'eau',
  label: 'Eau',
  requis: true,
  isSocle: true,
  ...overrides,
});

describe('applyNiveauCascade', () => {
  it('propage une saisie du constat actuel aux horizons vides', () => {
    expect(
      applyNiveauCascade({
        ligne: ligne(),
        horizon: 'maintenant',
        niveau: 'moyen',
      })
    ).toMatchObject({
      niveauMaintenant: 'moyen',
      niveau2050: 'moyen',
      niveau2100: 'moyen',
    });
  });

  it('n’écrase jamais une projection déjà corrigée à la main', () => {
    const corrigee = ligne({
      niveauMaintenant: 'moyen',
      niveau2050: 'moyen',
      niveau2100: 'fort',
    });
    expect(
      applyNiveauCascade({
        ligne: corrigee,
        horizon: 'maintenant',
        niveau: 'faible',
      })
    ).toMatchObject({
      niveauMaintenant: 'faible',
      niveau2050: 'moyen',
      niveau2100: 'fort',
    });
  });

  it('ne remonte pas vers les horizons antérieurs', () => {
    expect(
      applyNiveauCascade({ ligne: ligne(), horizon: '2050', niveau: 'fort' })
    ).toMatchObject({
      niveauMaintenant: null,
      niveau2050: 'fort',
      niveau2100: 'fort',
    });
  });

  it('traite « non concerné » comme les autres niveaux', () => {
    const partielle = ligne({ niveauMaintenant: 'fort', niveau2100: 'faible' });
    expect(
      applyNiveauCascade({
        ligne: partielle,
        horizon: 'maintenant',
        niveau: 'non_concerne',
      })
    ).toMatchObject({
      niveauMaintenant: 'non_concerne',
      niveau2050: 'non_concerne',
      niveau2100: 'faible',
    });
  });

  it('efface sans rien propager quand la saisie est retirée', () => {
    const remplie = ligne({
      niveauMaintenant: 'moyen',
      niveau2050: 'moyen',
      niveau2100: 'moyen',
    });
    expect(
      applyNiveauCascade({
        ligne: remplie,
        horizon: 'maintenant',
        niveau: null,
      })
    ).toMatchObject({
      niveauMaintenant: null,
      niveau2050: 'moyen',
      niveau2100: 'moyen',
    });
  });

  it('ne modifie pas la ligne reçue', () => {
    const origine = ligne();
    applyNiveauCascade({
      ligne: origine,
      horizon: 'maintenant',
      niveau: 'fort',
    });
    expect(origine.niveau2050).toBeNull();
  });
});

describe('isObjectifRequis', () => {
  it('n’exige un objectif que si le territoire est concerné', () => {
    expect(isObjectifRequis('faible')).toBe(true);
    expect(isObjectifRequis('fort')).toBe(true);
    expect(isObjectifRequis('non_concerne')).toBe(false);
    expect(isObjectifRequis(null)).toBe(false);
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

describe('isDemarchePcaetVulnerabiliteComplete', () => {
  const remplie = (domaineId: number): DemarchePcaetVulnerabiliteLigne =>
    ligne({
      domaineId,
      niveauMaintenant: 'non_concerne',
      niveau2050: 'non_concerne',
      niveau2100: 'non_concerne',
    });

  it('refuse un volet absent', () => {
    expect(isDemarchePcaetVulnerabiliteComplete(null)).toBe(false);
  });

  it('exige une ligne complète pour chaque domaine requis', () => {
    expect(
      isDemarchePcaetVulnerabiliteComplete({
        domaines: [
          domaine(),
          domaine({ id: 2, code: 'foret', label: 'Forêt' }),
        ],
        lignes: [remplie(1)],
      })
    ).toBe(false);
  });

  it('n’exige rien des domaines ajoutés par la collectivité', () => {
    expect(
      isDemarchePcaetVulnerabiliteComplete({
        domaines: [
          domaine(),
          domaine({
            id: 2,
            code: null,
            label: 'Zones humides',
            requis: false,
            isSocle: false,
          }),
        ],
        lignes: [remplie(1)],
      })
    ).toBe(true);
  });

  it('déclare complet un socle intégralement déclaré « non concerné »', () => {
    expect(
      isDemarchePcaetVulnerabiliteComplete({
        domaines: [
          domaine(),
          domaine({ id: 2, code: 'foret', label: 'Forêt' }),
        ],
        lignes: [remplie(1), remplie(2)],
      })
    ).toBe(true);
  });
});
