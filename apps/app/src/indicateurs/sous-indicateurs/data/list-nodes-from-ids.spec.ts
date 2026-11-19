import { describe, expect, it, vi } from 'vitest';
import type { SousIndicateurNode } from '../sous-indicateurs-table.rules';
import { listNodesFromIds, type ListNodesByIds } from './list-nodes-from-ids';

const toListNodesByIds = (
  nodes: readonly SousIndicateurNode[]
): ReturnType<typeof vi.fn<ListNodesByIds>> =>
  vi.fn<ListNodesByIds>(async (ids) =>
    nodes.filter(({ id }) => ids.includes(id))
  );

describe('listNodesFromIds', () => {
  it('interroge le listing une fois par niveau de profondeur et renvoie tous les descendants', async () => {
    const listNodesByIds = toListNodesByIds([
      { id: 1, label: 'Racine', enfantIds: [2, 3] },
      { id: 2, label: 'Enfant A', enfantIds: [4] },
      { id: 3, label: 'Enfant B', enfantIds: [] },
      { id: 4, label: 'Petit-enfant', enfantIds: [] },
    ]);

    const nodes = await listNodesFromIds({
      ids: [1],
      visitedIds: new Set(),
      listNodesByIds,
    });

    expect(nodes.map(({ id }) => id)).toEqual([1, 2, 3, 4]);
    expect(listNodesByIds.mock.calls).toEqual([[[1]], [[2, 3]], [[4]]]);
  });

  it("s'arrête quand un indicateur est son propre descendant", async () => {
    const listNodesByIds = toListNodesByIds([
      { id: 1, label: 'Racine', enfantIds: [2] },
      { id: 2, label: 'Enfant', enfantIds: [1] },
    ]);

    const nodes = await listNodesFromIds({
      ids: [1],
      visitedIds: new Set(),
      listNodesByIds,
    });

    expect(nodes.map(({ id }) => id)).toEqual([1, 2]);
    expect(listNodesByIds).toHaveBeenCalledTimes(2);
  });

  it("ne demande qu'une fois un identifiant déclaré plusieurs fois", async () => {
    const listNodesByIds = toListNodesByIds([
      { id: 1, label: 'Racine', enfantIds: [2, 2] },
      { id: 2, label: 'Enfant', enfantIds: [] },
    ]);

    const nodes = await listNodesFromIds({
      ids: [1, 1],
      visitedIds: new Set(),
      listNodesByIds,
    });

    expect(nodes.map(({ id }) => id)).toEqual([1, 2]);
    expect(listNodesByIds.mock.calls).toEqual([[[1]], [[2]]]);
  });

  it("ne renvoie rien et n'interroge pas le listing quand il n'y a aucun identifiant à charger", async () => {
    const listNodesByIds = toListNodesByIds([]);

    await expect(
      listNodesFromIds({ ids: [], visitedIds: new Set(), listNodesByIds })
    ).resolves.toEqual([]);
    expect(listNodesByIds).not.toHaveBeenCalled();
  });

  it("s'arrête quand le listing ne renvoie rien pour les identifiants demandés", async () => {
    const listNodesByIds = toListNodesByIds([]);

    await expect(
      listNodesFromIds({ ids: [1], visitedIds: new Set(), listNodesByIds })
    ).resolves.toEqual([]);
    expect(listNodesByIds).toHaveBeenCalledTimes(1);
  });
});
