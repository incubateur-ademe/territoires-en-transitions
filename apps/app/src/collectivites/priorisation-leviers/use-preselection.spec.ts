import type {
  ActionDeReference,
  ActionDeReferenceId,
} from '@tet/domain/shared';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  preselectionRules,
  StoredPreselection,
  usePreselection,
} from './use-preselection';

vi.mock('@tet/api/users', () => ({ useUser: () => ({ id: 'user-1' }) }));
vi.mock('@tet/api/collectivites', () => ({
  useCurrentCollectivite: () => ({ collectiviteId: 1 }),
}));

const toActionId = (id: number): ActionDeReferenceId =>
  id as ActionDeReferenceId;

const toAction = (id: number): ActionDeReference => ({
  id: toActionId(id),
  titre: `Action ${id}`,
  description: `Description ${id}`,
  levier: 'covoiturage',
  categorie: 'amenagement',
});

const {
  empty,
  deserialize,
  statusOf,
  addedToPlanOf,
  add,
  remove,
  ignore,
  restore,
  markAddedToPlan,
  clearAddedToPlan,
} = preselectionRules;

describe('preselectionRules', () => {
  it('démarre vide, toute action étant disponible', () => {
    expect(empty.preselected).toEqual([]);
    expect(statusOf(empty, toActionId(1))).toBe('disponible');
  });

  it('ajoute puis retire une action de la présélection', () => {
    const added = add(empty, toAction(1));
    expect(added.preselected).toEqual([toAction(1)]);
    expect(statusOf(added, toActionId(1))).toBe('preselectionnee');

    const removed = remove(added, toActionId(1));
    expect(removed.preselected).toEqual([]);
    expect(statusOf(removed, toActionId(1))).toBe('disponible');
  });

  it('ignorer une action présélectionnée la sort de la présélection', () => {
    const ignored = ignore(add(empty, toAction(1)), toActionId(1));

    expect(ignored.preselected).toEqual([]);
    expect(statusOf(ignored, toActionId(1))).toBe('ignoree');
  });

  it('ajouter une action ignorée annule son rejet', () => {
    const readded = add(ignore(empty, toActionId(1)), toAction(1));

    expect(statusOf(readded, toActionId(1))).toBe('preselectionnee');
    expect(readded.ignored).toEqual([]);
  });

  it('rétablir une action ignorée la rend disponible', () => {
    const restored = restore(ignore(empty, toActionId(1)), toActionId(1));

    expect(statusOf(restored, toActionId(1))).toBe('disponible');
  });

  it("n'ajoute pas deux fois la même action", () => {
    const addedTwice = add(add(empty, toAction(1)), toAction(1));

    expect(addedTwice.preselected).toEqual([toAction(1)]);
  });

  it("retient la fiche créée pour une action ajoutée à un plan, jusqu'à l'annulation", () => {
    const added = { actionId: toActionId(1), ficheId: 42, planNom: 'PCAET' };
    const marked = markAddedToPlan(add(empty, toAction(1)), added);
    expect(addedToPlanOf(marked, toActionId(1))).toEqual(added);

    const cleared = clearAddedToPlan(marked, toActionId(1));
    expect(addedToPlanOf(cleared, toActionId(1))).toBeUndefined();
    expect(cleared.preselected).toEqual([toAction(1)]);
  });

  it('un nouvel ajout au plan remplace le précédent pour la même action', () => {
    const first = { actionId: toActionId(1), ficheId: 42, planNom: 'PCAET' };
    const second = { actionId: toActionId(1), ficheId: 43, planNom: 'CRTE' };
    const marked = markAddedToPlan(markAddedToPlan(empty, first), second);

    expect(marked.addedToPlans).toEqual([second]);
  });

  it("retirer l'action de la présélection conserve le souvenir de son ajout au plan", () => {
    const added = { actionId: toActionId(1), ficheId: 42, planNom: 'PCAET' };
    const removed = remove(
      markAddedToPlan(add(empty, toAction(1)), added),
      toActionId(1)
    );

    expect(addedToPlanOf(removed, toActionId(1))).toEqual(added);
  });
});

describe('preselectionRules.deserialize', () => {
  it('relit une présélection enregistrée', () => {
    const stored: StoredPreselection = {
      preselected: [toAction(1)],
      ignored: [toActionId(2)],
      addedToPlans: [
        { actionId: toActionId(1), ficheId: 42, planNom: 'PCAET' },
      ],
    };

    expect(deserialize(JSON.stringify(stored))).toEqual(stored);
  });

  it('relit un enregistrement antérieur sans ajouts au plan', () => {
    const legacy = JSON.stringify({ preselected: [toAction(1)], ignored: [] });

    expect(deserialize(legacy)).toEqual({
      preselected: [toAction(1)],
      ignored: [],
      addedToPlans: [],
    });
  });

  it.each([
    ['du JSON invalide', '{not json'],
    ['une forme inconnue', JSON.stringify({ foo: 'bar' })],
    [
      'une action sans levier',
      JSON.stringify({
        preselected: [{ id: 1, titre: 'x', description: 'y' }],
        ignored: [],
      }),
    ],
  ])('repart de zéro devant %s', (_, raw) => {
    expect(deserialize(raw)).toEqual(empty);
  });
});

describe('usePreselection', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("garde une action ajoutée pendant qu'un ajout au plan, lancé avant, se termine", () => {
    const { result } = renderHook(() => usePreselection());
    const preselectionAuClic = result.current;
    const addedToPlan = {
      actionId: toActionId(2),
      ficheId: 42,
      planNom: 'PCAET',
    };

    act(() => result.current.add(toAction(1)));
    act(() => preselectionAuClic.markAddedToPlan(addedToPlan));

    expect(result.current.actions).toEqual([toAction(1)]);
    expect(result.current.addedToPlanOf(toActionId(2))).toEqual(addedToPlan);
  });

  it('ajoute encore une action quand le navigateur refuse la lecture du stockage', () => {
    const { result } = renderHook(() => usePreselection());
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new DOMException('Access denied', 'SecurityError');
      });

    act(() => result.current.add(toAction(1)));
    getItem.mockRestore();

    expect(result.current.actions).toEqual([toAction(1)]);
  });
});
