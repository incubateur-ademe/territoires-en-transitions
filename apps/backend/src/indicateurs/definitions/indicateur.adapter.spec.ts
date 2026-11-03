import { toIndicateurDefinition } from './indicateur-definition.test-fixture';
import {
  toIndicateurOrThrow,
  toIndicateurPredefiniOrThrow,
  toIndicateursOrThrow,
  toIndicateursPredefiniOrThrow,
} from './indicateur.adapter';

describe('toIndicateurPredefiniOrThrow', () => {
  it('rend un prédéfini tel quel', () => {
    const definition = toIndicateurDefinition({
      identifiantReferentiel: 'cae_1.a',
    });
    expect(toIndicateurPredefiniOrThrow(definition)).toEqual(definition);
  });

  it('refuse un perso, pourtant cohérent', () => {
    expect(() =>
      toIndicateurPredefiniOrThrow(
        toIndicateurDefinition({ id: 5, collectiviteId: 12 })
      )
    ).toThrow(
      'Indicateur 5 : un indicateur de la plateforme doit être prédéfini'
    );
  });

  it('nomme l’incohérence avant de refuser le perso', () => {
    expect(() =>
      toIndicateurPredefiniOrThrow(toIndicateurDefinition({ id: 6 }))
    ).toThrow(
      'Indicateur 6 : nature incohérente (PREDEFINI_WITHOUT_IDENTIFIANT_REFERENTIEL)'
    );
  });
});

describe('toIndicateursPredefiniOrThrow', () => {
  it('échoue en entier si une définition est un perso', () => {
    expect(() =>
      toIndicateursPredefiniOrThrow([
        toIndicateurDefinition({ id: 1, identifiantReferentiel: 'cae_1.a' }),
        toIndicateurDefinition({ id: 2, collectiviteId: 12 }),
      ])
    ).toThrow('Indicateur 2 : un indicateur de la plateforme');
  });
});

describe('toIndicateurOrThrow', () => {
  it('rend un perso tel quel', () => {
    const definition = toIndicateurDefinition({ collectiviteId: 12 });
    expect(toIndicateurOrThrow(definition)).toEqual(definition);
  });

  it('rend un prédéfini tel quel', () => {
    const definition = toIndicateurDefinition({
      identifiantReferentiel: 'cae_1.a',
    });
    expect(toIndicateurOrThrow(definition)).toEqual(definition);
  });

  it('garde les colonnes ajoutées par la requête', () => {
    const definition = {
      ...toIndicateurDefinition({ collectiviteId: 12 }),
      categories: [{ id: 1, nom: 'Énergie' }],
    };
    expect(toIndicateurOrThrow(definition)).toEqual(definition);
  });

  it.each([
    {
      label: 'un perso qui porte un identifiant référentiel',
      definition: toIndicateurDefinition({
        id: 7,
        collectiviteId: 12,
        identifiantReferentiel: 'cae_1.a',
      }),
      message:
        'Indicateur 7 : nature incohérente (PERSO_WITH_IDENTIFIANT_REFERENTIEL)',
    },
    {
      label: 'un perso rattaché à un groupement',
      definition: toIndicateurDefinition({
        id: 8,
        collectiviteId: 12,
        groupementId: 3,
      }),
      message: 'Indicateur 8 : nature incohérente (PERSO_WITH_GROUPEMENT)',
    },
    {
      label: 'une définition sans collectivité ni identifiant référentiel',
      definition: toIndicateurDefinition({ id: 9 }),
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
      toIndicateurDefinition({ id: 1, collectiviteId: 12 }),
      toIndicateurDefinition({ id: 2, identifiantReferentiel: 'cae_1.a' }),
    ];
    expect(toIndicateursOrThrow(definitions)).toEqual(definitions);
  });

  it('échoue en entier si une seule définition est incohérente', () => {
    const definitions = [
      toIndicateurDefinition({ id: 1, collectiviteId: 12 }),
      toIndicateurDefinition({ id: 2 }),
    ];
    expect(() => toIndicateursOrThrow(definitions)).toThrow(
      'Indicateur 2 : nature incohérente'
    );
  });
});
