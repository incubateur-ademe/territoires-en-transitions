import type {
  ActionDeReference,
  ActionDeReferenceId,
  CategorieAction,
  LevierId,
} from '@tet/domain/shared';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePreselectionFiltering } from './preselection.filters';

const toAction = ({
  id,
  levier,
  categorie,
}: {
  id: number;
  levier: LevierId;
  categorie: CategorieAction;
}): ActionDeReference => ({
  id: id as ActionDeReferenceId,
  titre: `Action ${id}`,
  description: `Description ${id}`,
  levier,
  categorie,
});

const covoiturageAmenagement = toAction({
  id: 1,
  levier: 'covoiturage',
  categorie: 'amenagement',
});

const biogazFinancement = toAction({
  id: 2,
  levier: 'biogaz',
  categorie: 'financement',
});

describe('usePreselectionFiltering', () => {
  it('filtre la présélection sur le levier choisi', () => {
    const { result } = renderHook(() =>
      usePreselectionFiltering([covoiturageAmenagement, biogazFinancement])
    );

    act(() => result.current.chooseLevier('covoiturage'));

    expect(result.current.filteredActions).toEqual([covoiturageAmenagement]);
  });

  it("lâche le levier choisi quand plus aucune action de la présélection n'y appartient", () => {
    const { result, rerender } = renderHook(
      ({ actions }) => usePreselectionFiltering(actions),
      {
        initialProps: {
          actions: [covoiturageAmenagement, biogazFinancement],
        },
      }
    );

    act(() => result.current.chooseLevier('covoiturage'));
    rerender({ actions: [biogazFinancement] });

    expect(result.current.filter).toEqual({});
    expect(result.current.filteredActions).toEqual([biogazFinancement]);
  });

  it("lâche la catégorie choisie quand plus aucune action de la présélection n'y appartient", () => {
    const { result, rerender } = renderHook(
      ({ actions }) => usePreselectionFiltering(actions),
      {
        initialProps: {
          actions: [covoiturageAmenagement, biogazFinancement],
        },
      }
    );

    act(() => result.current.chooseCategorie('amenagement'));
    rerender({ actions: [biogazFinancement] });

    expect(result.current.filter).toEqual({});
    expect(result.current.filteredActions).toEqual([biogazFinancement]);
  });
});
