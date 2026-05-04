import { FicheSearchDocSchema } from './fiche-search-doc.schema';

describe('FicheSearchDocSchema', () => {
  it('parses an Action (parentId: null)', () => {
    const result = FicheSearchDocSchema.safeParse({
      id: 1,
      titre: 'Réduire les déchets',
      description: null,
      parentId: null,
      visibleCollectiviteIds: [42],
    });
    expect(result.success).toBe(true);
  });

  it('parses a Sous-action (parentId: 42)', () => {
    const result = FicheSearchDocSchema.safeParse({
      id: 2,
      titre: 'Composteur de quartier',
      description: 'Mise en place...',
      parentId: 42,
      visibleCollectiviteIds: [42, 99],
    });
    expect(result.success).toBe(true);
  });

  it('rejects when visibleCollectiviteIds is missing', () => {
    const result = FicheSearchDocSchema.safeParse({
      id: 1,
      titre: 'x',
      description: null,
      parentId: null,
    });
    expect(result.success).toBe(false);
  });
});
