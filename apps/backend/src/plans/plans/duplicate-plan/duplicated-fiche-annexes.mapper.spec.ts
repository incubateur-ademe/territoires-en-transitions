import type { AnnexeRow } from '@tet/backend/plans/fiches/add-annexe/add-annexe.repository';
import { describe, expect, test } from 'vitest';
import { mapSourceFicheAnnexes } from './duplicated-fiche-annexes.mapper';

const sourceAnnexe = (overrides: Partial<AnnexeRow>): AnnexeRow => ({
  id: 1,
  collectiviteId: 10,
  ficheId: 100,
  fichierId: null,
  url: null,
  titre: null,
  commentaire: null,
  lien: null,
  modifiedAt: '2026-01-01T00:00:00.000Z',
  modifiedBy: 'source-user',
  ...overrides,
});

describe('mapSourceFicheAnnexes', () => {
  test('recopie une annexe-fichier et une annexe-lien vers la nouvelle fiche', () => {
    const annexes = [
      sourceAnnexe({ id: 1, fichierId: 42, commentaire: 'preuve A' }),
      sourceAnnexe({
        id: 2,
        url: 'https://example.org',
        titre: 'Doc externe',
        commentaire: 'lien B',
      }),
    ];

    const result = mapSourceFicheAnnexes(annexes, {
      newFicheId: 200,
      collectiviteId: 10,
      modifiedBy: 'duplicating-user',
    });

    expect(result).toEqual([
      {
        collectiviteId: 10,
        ficheId: 200,
        fichierId: 42,
        url: null,
        titre: null,
        commentaire: 'preuve A',
        modifiedBy: 'duplicating-user',
      },
      {
        collectiviteId: 10,
        ficheId: 200,
        fichierId: null,
        url: 'https://example.org',
        titre: 'Doc externe',
        commentaire: 'lien B',
        modifiedBy: 'duplicating-user',
      },
    ]);
  });

  test("n'inclut ni l'id, ni le modifiedAt, ni le lien généré de la source", () => {
    const result = mapSourceFicheAnnexes(
      [
        sourceAnnexe({
          id: 7,
          modifiedAt: '2020-01-01T00:00:00.000Z',
          lien: { titre: 'genere', url: 'https://example.org' },
        }),
      ],
      { newFicheId: 200, collectiviteId: 10, modifiedBy: 'duplicating-user' }
    );

    expect(result[0]).not.toHaveProperty('id');
    expect(result[0]).not.toHaveProperty('modifiedAt');
    expect(result[0]).not.toHaveProperty('lien');
  });

  test('retourne un tableau vide pour une fiche sans annexe', () => {
    expect(
      mapSourceFicheAnnexes([], {
        newFicheId: 200,
        collectiviteId: 10,
        modifiedBy: 'duplicating-user',
      })
    ).toEqual([]);
  });
});
