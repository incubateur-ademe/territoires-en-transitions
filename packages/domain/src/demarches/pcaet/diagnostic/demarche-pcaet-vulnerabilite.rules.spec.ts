import { describe, expect, it } from 'vitest';
import { applyNiveauCascade } from './demarche-pcaet-vulnerabilite.rules';
import type { DemarchePcaetVulnerabiliteLigne } from './demarche-pcaet-vulnerabilite.schema';

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
