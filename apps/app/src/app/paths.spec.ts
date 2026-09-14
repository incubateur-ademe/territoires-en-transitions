import { ActionTypeEnum, type ActionType } from '@tet/domain/referentiels';
import { makeReferentielTacheUrl, makeSignInUrl, signInPath } from './paths';

const hierarchieAvecSousAxe: ActionType[] = [
  ActionTypeEnum.REFERENTIEL,
  ActionTypeEnum.AXE,
  ActionTypeEnum.SOUS_AXE,
  ActionTypeEnum.ACTION,
  ActionTypeEnum.SOUS_ACTION,
  ActionTypeEnum.TACHE,
];

const hierarchieSansSousAxe: ActionType[] = [
  ActionTypeEnum.REFERENTIEL,
  ActionTypeEnum.AXE,
  ActionTypeEnum.ACTION,
  ActionTypeEnum.SOUS_ACTION,
  ActionTypeEnum.TACHE,
];

describe('makeSignInUrl', () => {
  it('sans destination (ou racine) → /login', () => {
    expect(makeSignInUrl()).toBe(signInPath);
    expect(makeSignInUrl(null)).toBe(signInPath);
    expect(makeSignInUrl('/')).toBe(signInPath);
  });

  it('encode la destination dans redirect_to', () => {
    expect(makeSignInUrl('/collectivite/5556/plans/43766')).toBe(
      '/login?redirect_to=%2Fcollectivite%2F5556%2Fplans%2F43766'
    );
  });

  it('préserve la query string de la destination', () => {
    expect(makeSignInUrl('/collectivite/5556/plans/43766?openAxes=1')).toBe(
      '/login?redirect_to=%2Fcollectivite%2F5556%2Fplans%2F43766%3FopenAxes%3D1'
    );
  });
});

describe('makeReferentielTacheUrl', () => {
  test('remonte à la mesure et ancre la sous-mesure sur un référentiel avec sous-axe', () => {
    expect(
      makeReferentielTacheUrl({
        collectiviteId: 1,
        actionId: 'te_1.1.1.1',
        referentielId: 'te',
        hierarchie: hierarchieAvecSousAxe,
      })
    ).toBe('/collectivite/1/referentiel/te/action/te_1.1.1#te_1.1.1.1');

    expect(
      makeReferentielTacheUrl({
        collectiviteId: 1,
        actionId: 'cae_1.1.1.1',
        referentielId: 'cae',
        hierarchie: hierarchieAvecSousAxe,
      })
    ).toBe('/collectivite/1/referentiel/cae/action/cae_1.1.1#cae_1.1.1.1');
  });

  test("n'ajoute pas d'ancre quand l'action est déjà une mesure", () => {
    expect(
      makeReferentielTacheUrl({
        collectiviteId: 1,
        actionId: 'te_1.1.1',
        referentielId: 'te',
        hierarchie: hierarchieAvecSousAxe,
      })
    ).toBe('/collectivite/1/referentiel/te/action/te_1.1.1');
  });

  test('remonte un cran plus haut sur eci, qui est sans sous-axe', () => {
    expect(
      makeReferentielTacheUrl({
        collectiviteId: 1,
        actionId: 'eci_1.1.1',
        referentielId: 'eci',
        hierarchie: hierarchieSansSousAxe,
      })
    ).toBe('/collectivite/1/referentiel/eci/action/eci_1.1#eci_1.1.1');
  });

  test('sans hiérarchie chargée, lien vers l’action elle-même sans ancre', () => {
    expect(
      makeReferentielTacheUrl({
        collectiviteId: 1,
        actionId: 'te_1.1.1.1',
        referentielId: 'te',
        hierarchie: [],
      })
    ).toBe('/collectivite/1/referentiel/te/action/te_1.1.1.1');
  });
});
