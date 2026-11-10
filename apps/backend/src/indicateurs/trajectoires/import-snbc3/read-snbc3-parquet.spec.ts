import { readSnbc3Parquet } from './read-snbc3-parquet';
import { buildSnbc3Parquet } from './snbc3-release.test-fixture';

describe('readSnbc3Parquet', () => {
  const territoires = [{ code: '200000172' }];

  test('lit un parquet conforme au contrat', async () => {
    const read = await readSnbc3Parquet(buildSnbc3Parquet(territoires));
    expect(read.success && read.data.territoires).toEqual([
      { code: '200000172', niveauGeo: 'EPCI', zone: 'HEXAGONE' },
    ]);
  });

  test('refuse une colonne manquante', async () => {
    expect(
      await readSnbc3Parquet(
        buildSnbc3Parquet(territoires, { withoutColumn: 'qualite' })
      )
    ).toEqual({
      success: false,
      error: {
        error: 'SNBC3_PARQUET_SCHEMA_INVALID',
        message: 'colonnes manquantes : qualite',
      },
    });
  });

  test('refuse une colonne d’un autre type physique', async () => {
    expect(
      await readSnbc3Parquet(
        buildSnbc3Parquet(territoires, {
          columnTypes: { valeur_recalee: 'FLOAT' },
        })
      )
    ).toEqual({
      success: false,
      error: {
        error: 'SNBC3_PARQUET_SCHEMA_INVALID',
        message: 'types inattendus : valeur_recalee en FLOAT au lieu de DOUBLE',
      },
    });
  });
});
