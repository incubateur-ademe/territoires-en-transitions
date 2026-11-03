import { toIndicateurRow } from './indicateur-row.test-fixture';
import {
  toIndicateurOrThrow,
  toIndicateurPredefiniOrThrow,
  toIndicateursOrThrow,
  toIndicateursPredefiniOrThrow,
  withPredefiniOrThrow,
} from './indicateur.adapter';

describe('withPredefiniOrThrow', () => {
  it('rend la ligne telle quelle, champs supplémentaires compris', () => {
    const row = {
      ...toIndicateurRow({ id: 3, identifiantReferentiel: 'cae_1.a' }),
      isApplicable: false,
    };
    expect(withPredefiniOrThrow(row)).toEqual(row);
  });

  it('refuse un perso', () => {
    expect(() =>
      withPredefiniOrThrow(toIndicateurRow({ id: 5, collectiviteId: 12 }))
    ).toThrow(
      'Indicateur 5 : un indicateur de la plateforme doit être prédéfini'
    );
  });
});

describe('toIndicateurPredefiniOrThrow', () => {
  it('rend un prédéfini tel quel', () => {
    const definition = toIndicateurRow({
      identifiantReferentiel: 'cae_1.a',
    });
    expect(toIndicateurPredefiniOrThrow(definition)).toEqual(definition);
  });

  it('refuse un perso, pourtant cohérent', () => {
    expect(() =>
      toIndicateurPredefiniOrThrow(
        toIndicateurRow({ id: 5, collectiviteId: 12 })
      )
    ).toThrow(
      'Indicateur 5 : un indicateur de la plateforme doit être prédéfini'
    );
  });

  it('nomme l’incohérence avant de refuser le perso', () => {
    expect(() =>
      toIndicateurPredefiniOrThrow(toIndicateurRow({ id: 6 }))
    ).toThrow(
      'Indicateur 6 : nature incohérente (PREDEFINI_WITHOUT_IDENTIFIANT_REFERENTIEL)'
    );
  });
});

describe('toIndicateursPredefiniOrThrow', () => {
  it('échoue en entier si une définition est un perso', () => {
    expect(() =>
      toIndicateursPredefiniOrThrow([
        toIndicateurRow({ id: 1, identifiantReferentiel: 'cae_1.a' }),
        toIndicateurRow({ id: 2, collectiviteId: 12 }),
      ])
    ).toThrow('Indicateur 2 : un indicateur de la plateforme');
  });
});

describe('toIndicateurOrThrow', () => {
  it('rend un perso tel quel', () => {
    const definition = toIndicateurRow({ collectiviteId: 12 });
    expect(toIndicateurOrThrow(definition)).toEqual(definition);
  });

  it('rend un prédéfini tel quel', () => {
    const definition = toIndicateurRow({
      identifiantReferentiel: 'cae_1.a',
    });
    expect(toIndicateurOrThrow(definition)).toEqual(definition);
  });

  it('garde les colonnes ajoutées par la requête', () => {
    const definition = {
      ...toIndicateurRow({ collectiviteId: 12 }),
      categories: [{ id: 1, nom: 'Énergie' }],
    };
    expect(toIndicateurOrThrow(definition)).toEqual(definition);
  });

  it.each([
    {
      label: 'un perso qui porte un identifiant référentiel',
      definition: toIndicateurRow({
        id: 7,
        collectiviteId: 12,
        identifiantReferentiel: 'cae_1.a',
      }),
      message:
        'Indicateur 7 : nature incohérente (PERSO_WITH_IDENTIFIANT_REFERENTIEL)',
    },
    {
      label: 'un perso rattaché à un groupement',
      definition: toIndicateurRow({
        id: 8,
        collectiviteId: 12,
        groupementId: 3,
      }),
      message: 'Indicateur 8 : nature incohérente (PERSO_WITH_GROUPEMENT)',
    },
    {
      label: 'une définition sans collectivité ni identifiant référentiel',
      definition: toIndicateurRow({ id: 9 }),
      message:
        'Indicateur 9 : nature incohérente (PREDEFINI_WITHOUT_IDENTIFIANT_REFERENTIEL)',
    },
  ])('lève une erreur pour $label', ({ definition, message }) => {
    expect(() => toIndicateurOrThrow(definition)).toThrow(message);
  });
});

describe('toIndicateursOrThrow', () => {
  it('convertit toutes les définitions dans l’ordre', () => {
    const definitions = [
      toIndicateurRow({ id: 1, collectiviteId: 12 }),
      toIndicateurRow({ id: 2, identifiantReferentiel: 'cae_1.a' }),
    ];
    expect(toIndicateursOrThrow(definitions)).toEqual(definitions);
  });

  it('échoue en entier si une seule définition est incohérente', () => {
    const definitions = [
      toIndicateurRow({ id: 1, collectiviteId: 12 }),
      toIndicateurRow({ id: 2 }),
    ];
    expect(() => toIndicateursOrThrow(definitions)).toThrow(
      'Indicateur 2 : nature incohérente'
    );
  });
});
