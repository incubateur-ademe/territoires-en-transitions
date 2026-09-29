import { describe, expect, it } from 'vitest';
import {
  listActionsDeReferenceInputSchema,
  updateActionDeReferenceInputSchema,
} from './action-de-reference.schema';

describe('list-actions', () => {
  it('trie par titre quand le front ne choisit pas de champ de tri', () => {
    const result = listActionsDeReferenceInputSchema.safeParse({});

    expect(result).toEqual({ success: true, data: { sortBy: 'titre' } });
  });

  it('accepte un tri par levier ou par catégorie', () => {
    const byLevier = listActionsDeReferenceInputSchema.safeParse({
      sortBy: 'levier',
    });
    const byCategorie = listActionsDeReferenceInputSchema.safeParse({
      sortBy: 'categorie',
    });

    expect(byLevier).toEqual({ success: true, data: { sortBy: 'levier' } });
    expect(byCategorie).toEqual({
      success: true,
      data: { sortBy: 'categorie' },
    });
  });

  it('refuse un tri sur la description', () => {
    const result = listActionsDeReferenceInputSchema.safeParse({
      sortBy: 'description',
    });

    expect(result).toMatchObject({
      success: false,
      error: { issues: [{ path: ['sortBy'], code: 'invalid_value' }] },
    });
  });

  it('ignore un sens de tri envoyé par le front', () => {
    const result = listActionsDeReferenceInputSchema.safeParse({
      sortBy: 'titre',
      direction: 'desc',
    });

    expect(result).toEqual({ success: true, data: { sortBy: 'titre' } });
  });

  it('accepte tous les filtres à la fois', () => {
    const result = listActionsDeReferenceInputSchema.safeParse({
      titre: 'vélo',
      description: 'piste',
      leviers: ['velo_transport_commun'],
      categories: ['amenagement', 'financement'],
      sortBy: 'levier',
    });

    expect(result).toEqual({
      success: true,
      data: {
        titre: 'vélo',
        description: 'piste',
        leviers: ['velo_transport_commun'],
        categories: ['amenagement', 'financement'],
        sortBy: 'levier',
      },
    });
  });

  it('accepte plusieurs leviers', () => {
    const result = listActionsDeReferenceInputSchema.safeParse({
      leviers: ['velo_transport_commun', 'covoiturage'],
    });

    expect(result).toEqual({
      success: true,
      data: {
        leviers: ['velo_transport_commun', 'covoiturage'],
        sortBy: 'titre',
      },
    });
  });

  it('refuse un levier donné par son libellé', () => {
    const result = listActionsDeReferenceInputSchema.safeParse({
      leviers: ['Vélo et transport en commun'],
    });

    expect(result).toMatchObject({
      success: false,
      error: { issues: [{ path: ['leviers', 0], code: 'invalid_value' }] },
    });
  });

  it('accepte une liste de leviers vide et la rend absente', () => {
    const result = listActionsDeReferenceInputSchema.safeParse({
      leviers: [],
    });

    expect(result).toStrictEqual({
      success: true,
      data: { leviers: undefined, sortBy: 'titre' },
    });
  });

  it('refuse une catégorie hors liste', () => {
    const result = listActionsDeReferenceInputSchema.safeParse({
      categories: ['amenagement', 'communication'],
    });

    expect(result).toMatchObject({
      success: false,
      error: { issues: [{ path: ['categories', 1], code: 'invalid_value' }] },
    });
  });

  it('accepte une liste de catégories vide et la rend absente', () => {
    const result = listActionsDeReferenceInputSchema.safeParse({
      categories: [],
    });

    expect(result).toStrictEqual({
      success: true,
      data: { categories: undefined, sortBy: 'titre' },
    });
  });
});

describe('update-action', () => {
  it("accepte l'id seul", () => {
    const result = updateActionDeReferenceInputSchema.safeParse({ id: 12 });

    expect(result).toEqual({ success: true, data: { id: 12 } });
  });

  it('accepte un changement du titre, de la description, du levier et de la catégorie', () => {
    const result = updateActionDeReferenceInputSchema.safeParse({
      id: 12,
      titre: 'Créer des pistes cyclables',
      description: 'Relier les communes du territoire',
      levier: 'velo_transport_commun',
      categorie: 'amenagement',
    });

    expect(result).toEqual({
      success: true,
      data: {
        id: 12,
        titre: 'Créer des pistes cyclables',
        description: 'Relier les communes du territoire',
        levier: 'velo_transport_commun',
        categorie: 'amenagement',
      },
    });
  });

  it('refuse une mise à jour sans id', () => {
    const result = updateActionDeReferenceInputSchema.safeParse({
      titre: 'Créer des pistes cyclables',
    });

    expect(result).toMatchObject({
      success: false,
      error: { issues: [{ path: ['id'], code: 'invalid_type' }] },
    });
  });

  it('refuse un titre vide', () => {
    const result = updateActionDeReferenceInputSchema.safeParse({
      id: 12,
      titre: '',
    });

    expect(result).toMatchObject({
      success: false,
      error: { issues: [{ path: ['titre'], code: 'too_small' }] },
    });
  });

  it("refuse un titre fait d'espaces", () => {
    const result = updateActionDeReferenceInputSchema.safeParse({
      id: 12,
      titre: '   ',
    });

    expect(result).toMatchObject({
      success: false,
      error: { issues: [{ path: ['titre'], code: 'too_small' }] },
    });
  });

  it('refuse une description vide', () => {
    const result = updateActionDeReferenceInputSchema.safeParse({
      id: 12,
      description: '',
    });

    expect(result).toMatchObject({
      success: false,
      error: { issues: [{ path: ['description'], code: 'too_small' }] },
    });
  });

  it("refuse une description faite d'espaces", () => {
    const result = updateActionDeReferenceInputSchema.safeParse({
      id: 12,
      description: '   ',
    });

    expect(result).toMatchObject({
      success: false,
      error: { issues: [{ path: ['description'], code: 'too_small' }] },
    });
  });

  it('refuse un levier hors liste', () => {
    const result = updateActionDeReferenceInputSchema.safeParse({
      id: 12,
      levier: 'teletravail',
    });

    expect(result).toMatchObject({
      success: false,
      error: { issues: [{ path: ['levier'], code: 'invalid_value' }] },
    });
  });

  it('refuse une catégorie hors liste', () => {
    const result = updateActionDeReferenceInputSchema.safeParse({
      id: 12,
      categorie: 'communication',
    });

    expect(result).toMatchObject({
      success: false,
      error: { issues: [{ path: ['categorie'], code: 'invalid_value' }] },
    });
  });

  it.each([0, -1])(
    "refuse un id qui n'est pas un entier positif (%i)",
    (id) => {
      const result = updateActionDeReferenceInputSchema.safeParse({ id });

      expect(result).toMatchObject({
        success: false,
        error: { issues: [{ path: ['id'], code: 'too_small' }] },
      });
    }
  );

  it('refuse un id décimal', () => {
    const result = updateActionDeReferenceInputSchema.safeParse({ id: 1.5 });

    expect(result).toMatchObject({
      success: false,
      error: { issues: [{ path: ['id'], code: 'invalid_type' }] },
    });
  });

  it('refuse un id supérieur à 2147483647, la borne des entiers 32 bits', () => {
    const result = updateActionDeReferenceInputSchema.safeParse({
      id: 2147483648,
    });

    expect(result).toMatchObject({
      success: false,
      error: { issues: [{ path: ['id'], code: 'too_big' }] },
    });
  });
});

describe('invariants', () => {
  it('retire les espaces autour du titre et de la description', () => {
    const result = updateActionDeReferenceInputSchema.safeParse({
      id: 12,
      titre: '  Créer des pistes cyclables ',
      description: ' Relier les communes du territoire  ',
    });

    expect(result).toEqual({
      success: true,
      data: {
        id: 12,
        titre: 'Créer des pistes cyclables',
        description: 'Relier les communes du territoire',
      },
    });
  });

  it("retire les espaces autour du texte cherché, un texte vide ou fait d'espaces devient absent", () => {
    const blankTitre = listActionsDeReferenceInputSchema.safeParse({
      titre: '   ',
      description: ' piste ',
    });
    const emptyTitre = listActionsDeReferenceInputSchema.safeParse({
      titre: '',
    });

    expect(blankTitre).toStrictEqual({
      success: true,
      data: { titre: undefined, description: 'piste', sortBy: 'titre' },
    });
    expect(emptyTitre).toStrictEqual({
      success: true,
      data: { titre: undefined, sortBy: 'titre' },
    });
  });

  it('garde un champ à modifier explicitement indéfini, sans le refuser', () => {
    const result = updateActionDeReferenceInputSchema.safeParse({
      id: 12,
      titre: undefined,
    });

    expect(result).toStrictEqual({
      success: true,
      data: { id: 12, titre: undefined },
    });
  });
});
