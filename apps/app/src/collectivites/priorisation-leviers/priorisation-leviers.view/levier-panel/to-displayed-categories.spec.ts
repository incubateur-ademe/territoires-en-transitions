import type {
  ActionDeReference,
  ActionDeReferenceId,
  CategorieAction,
} from '@tet/domain/shared';
import { describe, expect, it } from 'vitest';
import { toDisplayedCategories } from './to-displayed-categories';

const toAction = (categories: CategorieAction[]): ActionDeReference => ({
  id: 1 as ActionDeReferenceId,
  titre: 'Action',
  description: 'Description',
  leviers: ['covoiturage'],
  categories,
});

const planificationEtFinancement = toAction(['planification', 'financement']);

describe('toDisplayedCategories', () => {
  it('garde toutes les catégories de l’action quand aucun filtre n’est actif', () => {
    expect(
      toDisplayedCategories({
        action: planificationEtFinancement,
        filteredCategories: [],
      })
    ).toEqual(['planification', 'financement']);
  });

  it('ne garde que la catégorie filtrée quand l’action en a plusieurs', () => {
    expect(
      toDisplayedCategories({
        action: planificationEtFinancement,
        filteredCategories: ['amenagement', 'financement'],
      })
    ).toEqual(['financement']);
  });

  it('place l’action sous une seule catégorie quand le filtre en recouvre plusieurs', () => {
    expect(
      toDisplayedCategories({
        action: planificationEtFinancement,
        filteredCategories: ['financement', 'planification'],
      })
    ).toEqual(['planification']);
  });

  it('ne place l’action sous aucune catégorie quand le filtre ne la recouvre pas', () => {
    expect(
      toDisplayedCategories({
        action: planificationEtFinancement,
        filteredCategories: ['exemplarite'],
      })
    ).toEqual([]);
  });
});
