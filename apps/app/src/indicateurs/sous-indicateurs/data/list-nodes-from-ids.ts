import { uniq } from 'es-toolkit';
import type { SousIndicateurNode } from '../sous-indicateurs-table.rules';

export type ListNodesByIds = (
  ids: readonly number[]
) => Promise<SousIndicateurNode[]>;

export const listNodesFromIds = async ({
  ids,
  visitedIds,
  listNodesByIds,
}: {
  ids: readonly number[];
  visitedIds: ReadonlySet<number>;
  listNodesByIds: ListNodesByIds;
}): Promise<SousIndicateurNode[]> => {
  const pendingIds = uniq(ids.filter((id) => !visitedIds.has(id)));
  if (pendingIds.length === 0) {
    return [];
  }
  const nodes = await listNodesByIds(pendingIds);
  const descendants = await listNodesFromIds({
    ids: nodes.flatMap(({ enfantIds }) => enfantIds),
    visitedIds: new Set([...visitedIds, ...pendingIds]),
    listNodesByIds,
  });
  return [...nodes, ...descendants];
};
