import { failure, success } from '@tet/backend/utils/result.type';
import { toIndicateurRow } from './indicateur-row.test-fixture';
import {
  validateNature,
  validateNatures,
  validatePredefini,
  validatePredefinis,
} from './indicateur.adapter';

const incoherentRows = [
  {
    label: 'un perso qui porte un identifiant référentiel',
    row: toIndicateurRow({
      id: 7,
      collectiviteId: 12,
      identifiantReferentiel: 'cae_1.a',
    }),
    message:
      'Indicateur 7 : nature incohérente (PERSO_WITH_IDENTIFIANT_REFERENTIEL)',
  },
  {
    label: 'un perso rattaché à un groupement',
    row: toIndicateurRow({ id: 8, collectiviteId: 12, groupementId: 3 }),
    message: 'Indicateur 8 : nature incohérente (PERSO_WITH_GROUPEMENT)',
  },
  {
    label: 'une définition sans collectivité ni identifiant référentiel',
    row: toIndicateurRow({ id: 9 }),
    message:
      'Indicateur 9 : nature incohérente (PREDEFINI_WITHOUT_IDENTIFIANT_REFERENTIEL)',
  },
];

describe('validateNature', () => {
  it('rend un perso tel quel', () => {
    const row = toIndicateurRow({ collectiviteId: 12 });
    expect(validateNature(row)).toEqual(success(row));
  });

  it('rend un prédéfini tel quel', () => {
    const row = toIndicateurRow({ identifiantReferentiel: 'cae_1.a' });
    expect(validateNature(row)).toEqual(success(row));
  });

  it('garde les colonnes ajoutées par la requête', () => {
    const row = {
      ...toIndicateurRow({ collectiviteId: 12 }),
      categories: [{ id: 1, nom: 'Énergie' }],
    };
    expect(validateNature(row)).toEqual(success(row));
  });

  it.each(incoherentRows)('refuse $label', ({ row, message }) => {
    expect(validateNature(row)).toEqual(
      failure('DATABASE_ERROR', new Error(message))
    );
  });
});

describe('validateNatures', () => {
  it('valide toutes les lignes dans l’ordre', () => {
    const rows = [
      toIndicateurRow({ id: 1, collectiviteId: 12 }),
      toIndicateurRow({ id: 2, identifiantReferentiel: 'cae_1.a' }),
    ];
    expect(validateNatures(rows)).toEqual(success(rows));
  });

  it('échoue en entier si une seule ligne est incohérente', () => {
    const rows = [
      toIndicateurRow({ id: 1, collectiviteId: 12 }),
      toIndicateurRow({ id: 2 }),
    ];
    expect(validateNatures(rows)).toEqual(
      failure(
        'DATABASE_ERROR',
        new Error(
          'Indicateur 2 : nature incohérente (PREDEFINI_WITHOUT_IDENTIFIANT_REFERENTIEL)'
        )
      )
    );
  });
});

describe('validatePredefini', () => {
  it('rend la ligne telle quelle, champs supplémentaires compris', () => {
    const row = {
      ...toIndicateurRow({ id: 3, identifiantReferentiel: 'cae_1.a' }),
      isApplicable: false,
    };
    expect(validatePredefini(row)).toEqual(success(row));
  });

  it('refuse un perso', () => {
    expect(
      validatePredefini(toIndicateurRow({ id: 5, collectiviteId: 12 }))
    ).toEqual(
      failure(
        'DATABASE_ERROR',
        new Error(
          'Indicateur 5 : un indicateur de la plateforme doit être prédéfini'
        )
      )
    );
  });

  it('nomme l’incohérence avant de refuser le perso', () => {
    expect(validatePredefini(toIndicateurRow({ id: 6 }))).toEqual(
      failure(
        'DATABASE_ERROR',
        new Error(
          'Indicateur 6 : nature incohérente (PREDEFINI_WITHOUT_IDENTIFIANT_REFERENTIEL)'
        )
      )
    );
  });
});

describe('validatePredefinis', () => {
  it('échoue en entier si une ligne est un perso', () => {
    expect(
      validatePredefinis([
        toIndicateurRow({ id: 1, identifiantReferentiel: 'cae_1.a' }),
        toIndicateurRow({ id: 2, collectiviteId: 12 }),
      ])
    ).toEqual(
      failure(
        'DATABASE_ERROR',
        new Error(
          'Indicateur 2 : un indicateur de la plateforme doit être prédéfini'
        )
      )
    );
  });
});
