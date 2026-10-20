import type { ActionsDeReferenceList } from '@/app/shared/actions-de-reference/actions-de-reference.contract';
import type {
  ActionDeReference,
  ActionDeReferenceId,
  CategorieAction,
} from '@tet/domain/shared';
import { describe, expect, it, vi } from 'vitest';
import { keepCategories } from './keep-categories';

const toAction = ({
  id,
  categories,
}: {
  id: number;
  categories: CategorieAction[];
}): ActionDeReference => ({
  id: id as ActionDeReferenceId,
  titre: `Action ${id}`,
  description: `Description ${id}`,
  leviers: ['covoiturage'],
  categories,
});

const amenagement = toAction({ id: 1, categories: ['amenagement'] });
const financement = toAction({ id: 2, categories: ['financement'] });
const gouvernanceEtFinancement = toAction({
  id: 3,
  categories: ['gouvernance', 'financement'],
});

const loaded: ActionsDeReferenceList = {
  status: 'loaded',
  actions: [amenagement, financement, gouvernanceEtFinancement],
};

describe('keepCategories', () => {
  it('ne garde que les actions de la catégorie choisie', () => {
    expect(
      keepCategories({ list: loaded, categories: ['amenagement'] })
    ).toEqual({ status: 'loaded', actions: [amenagement] });
  });

  it('garde les actions de chacune des catégories choisies, sans doublon', () => {
    expect(
      keepCategories({
        list: loaded,
        categories: ['amenagement', 'financement'],
      })
    ).toEqual({
      status: 'loaded',
      actions: [amenagement, financement, gouvernanceEtFinancement],
    });
  });

  it('renvoie une liste vide quand aucune action ne relève des catégories choisies', () => {
    expect(
      keepCategories({ list: loaded, categories: ['exemplarite'] })
    ).toEqual({ status: 'loaded', actions: [] });
  });

  it('garde toutes les actions quand aucune catégorie n’est choisie', () => {
    expect(keepCategories({ list: loaded, categories: [] })).toBe(loaded);
  });

  it('laisse intact un chargement en cours', () => {
    const loading: ActionsDeReferenceList = { status: 'loading' };

    expect(keepCategories({ list: loading, categories: ['financement'] })).toBe(
      loading
    );
  });

  it('laisse intacte une erreur, avec son action de nouvel essai', () => {
    const error: ActionsDeReferenceList = { status: 'error', retry: vi.fn() };

    expect(keepCategories({ list: error, categories: ['financement'] })).toBe(
      error
    );
  });
});
