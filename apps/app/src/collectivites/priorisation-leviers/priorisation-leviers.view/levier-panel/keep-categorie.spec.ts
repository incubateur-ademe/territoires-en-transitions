import type { ActionsDeReferenceList } from '@/app/shared/actions-de-reference/actions-de-reference.contract';
import type {
  ActionDeReference,
  ActionDeReferenceId,
  CategorieAction,
} from '@tet/domain/shared';
import { describe, expect, it, vi } from 'vitest';
import { keepCategorie } from './keep-categorie';

const toAction = ({
  id,
  categorie,
}: {
  id: number;
  categorie: CategorieAction;
}): ActionDeReference => ({
  id: id as ActionDeReferenceId,
  titre: `Action ${id}`,
  description: `Description ${id}`,
  levier: 'covoiturage',
  categorie,
});

const amenagement = toAction({ id: 1, categorie: 'amenagement' });
const financement = toAction({ id: 2, categorie: 'financement' });

const loaded: ActionsDeReferenceList = {
  status: 'loaded',
  actions: [amenagement, financement],
};

describe('keepCategorie', () => {
  it('ne garde que les actions de la catégorie choisie', () => {
    expect(keepCategorie({ list: loaded, categorie: 'financement' })).toEqual({
      status: 'loaded',
      actions: [financement],
    });
  });

  it('renvoie une liste vide quand aucune action ne relève de la catégorie choisie', () => {
    expect(keepCategorie({ list: loaded, categorie: 'gouvernance' })).toEqual({
      status: 'loaded',
      actions: [],
    });
  });

  it('garde toutes les actions quand aucune catégorie n’est choisie', () => {
    expect(keepCategorie({ list: loaded, categorie: undefined })).toBe(loaded);
  });

  it('laisse intact un chargement en cours', () => {
    const loading: ActionsDeReferenceList = { status: 'loading' };

    expect(keepCategorie({ list: loading, categorie: 'financement' })).toBe(
      loading
    );
  });

  it('laisse intacte une erreur, avec son action de nouvel essai', () => {
    const error: ActionsDeReferenceList = { status: 'error', retry: vi.fn() };

    expect(keepCategorie({ list: error, categorie: 'financement' })).toBe(
      error
    );
  });
});
