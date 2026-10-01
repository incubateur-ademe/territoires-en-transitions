import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { CategorieTag } from '@tet/domain/collectivites';
import { describe, expect, it, vi } from 'vitest';
import { ImportIndicateurRelationsService } from './import-indicateur-relations.service';
import { sampleImportIndicateurDefinition } from './samples/import-indicateur-definition.sample';

const categoryName = 'referentiel_cae';
const publicCategory: CategorieTag = {
  id: 11,
  nom: categoryName,
  collectiviteId: null,
  groupementId: null,
  visible: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  createdBy: null,
};
const scopedCategories = [
  { ...publicCategory, id: 22, collectiviteId: 999 },
  { ...publicCategory, id: 23, groupementId: 888 },
  { ...publicCategory, id: 24, collectiviteId: 999, groupementId: 888 },
];

function setup(categories: CategorieTag[]) {
  const tx = {} as Transaction;
  const createdCategory = { ...publicCategory, id: 33 };
  const repository = {
    listCategories: vi.fn().mockResolvedValue(categories),
    listThematiques: vi.fn().mockResolvedValue([]),
    createCategories: vi.fn().mockResolvedValue([createdCategory]),
    createThematiques: vi.fn(),
    replaceCategorieRelations: vi.fn().mockResolvedValue(undefined),
    replaceThematiqueRelations: vi.fn().mockResolvedValue(undefined),
    replaceGroupRelations: vi.fn().mockResolvedValue(undefined),
  };
  const service = new ImportIndicateurRelationsService(repository as never);
  const input = {
    definitions: [
      {
        ...sampleImportIndicateurDefinition,
        categories: [categoryName],
        thematiques: [],
        parents: null,
      },
    ],
    created: [{ id: 42, identifiantReferentiel: 'cae_1.a' }],
  };
  const context = { user: null, isUserTrusted: true, tx };
  return { service, repository, input, context, createdCategory, tx };
}

describe('ImportIndicateurRelationsService — catégories publiques', () => {
  it.each(
    scopedCategories.flatMap((scoped) => [
      {
        scoped,
        order: 'public puis local',
        categories: [publicCategory, scoped],
      },
      {
        scoped,
        order: 'local puis public',
        categories: [scoped, publicCategory],
      },
    ])
  )(
    'réutilise la catégorie publique malgré le tag $scoped.id, ordre $order',
    async ({ categories }) => {
      const h = setup(categories);
      await expect(h.service.replace(h.input, h.context)).resolves.toEqual({
        success: true,
        data: undefined,
      });
      expect(h.repository.replaceCategorieRelations).toHaveBeenCalledWith(
        [42],
        [{ indicateurId: 42, categorieTagId: publicCategory.id }],
        h.tx
      );
      expect(h.repository.createCategories).not.toHaveBeenCalled();
      expect(h.repository.listCategories).toHaveBeenCalledWith(h.tx);
    }
  );

  it.each(scopedCategories)(
    'crée une catégorie publique quand seul le tag local $id existe',
    async (scoped) => {
      const h = setup([scoped]);
      await expect(h.service.replace(h.input, h.context)).resolves.toEqual({
        success: true,
        data: undefined,
      });
      expect(h.repository.createCategories).toHaveBeenCalledExactlyOnceWith(
        [{ nom: categoryName }],
        h.tx
      );
      expect(h.repository.replaceCategorieRelations).toHaveBeenCalledWith(
        [42],
        [{ indicateurId: 42, categorieTagId: h.createdCategory.id }],
        h.tx
      );
      expect(h.repository.listCategories).toHaveBeenCalledWith(h.tx);
      expect(h.repository.listThematiques).toHaveBeenCalledWith(h.tx);
      expect(h.repository.replaceThematiqueRelations).toHaveBeenCalledWith(
        [42],
        [],
        h.tx
      );
      expect(h.repository.replaceGroupRelations).toHaveBeenCalledWith(
        [42],
        [],
        h.tx
      );
    }
  );

  it('crée une seule catégorie publique commune à plusieurs définitions malgré plusieurs homonymes locaux', async () => {
    const h = setup(scopedCategories);
    const input = {
      definitions: [
        h.input.definitions[0],
        { ...h.input.definitions[0], identifiantReferentiel: 'cae_1.b' },
      ],
      created: [
        ...h.input.created,
        { id: 43, identifiantReferentiel: 'cae_1.b' },
      ],
    };
    await expect(h.service.replace(input, h.context)).resolves.toEqual({
      success: true,
      data: undefined,
    });
    expect(h.repository.createCategories).toHaveBeenCalledExactlyOnceWith(
      [{ nom: categoryName }],
      h.tx
    );
    expect(h.repository.replaceCategorieRelations).toHaveBeenCalledWith(
      [42, 43],
      [
        { indicateurId: 42, categorieTagId: h.createdCategory.id },
        { indicateurId: 43, categorieTagId: h.createdCategory.id },
      ],
      h.tx
    );
  });

  it('ne remplace aucune relation si la création de la catégorie publique échoue', async () => {
    const h = setup(scopedCategories);
    const cause = new Error('category insert failed');
    h.repository.createCategories.mockRejectedValue(cause);
    await expect(h.service.replace(h.input, h.context)).resolves.toMatchObject({
      success: false,
      error: 'DATABASE_ERROR',
      cause,
    });
    expect(h.repository.replaceCategorieRelations).not.toHaveBeenCalled();
    expect(h.repository.replaceThematiqueRelations).not.toHaveBeenCalled();
    expect(h.repository.replaceGroupRelations).not.toHaveBeenCalled();
  });
});
