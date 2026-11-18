import { partialMatchKey } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { toNodesQueryKey } from './to-nodes-query-key';

const toListQueryKey = (collectiviteId: number) => [
  ['indicateurs', 'indicateurs', 'list'],
  { input: { collectiviteId }, type: 'query' },
];

const nodesQueryKey = toNodesQueryKey({
  listQueryKey: toListQueryKey(12),
  indicateurId: 5,
});

describe('toNodesQueryKey', () => {
  it("est reconnue par l'invalidation du listing d'une collectivité, comme celle d'une mise à jour ou d'une suppression d'indicateur", () => {
    expect(partialMatchKey(nodesQueryKey, toListQueryKey(12))).toBe(true);
  });

  it("n'est pas reconnue par l'invalidation du listing d'une autre collectivité", () => {
    expect(partialMatchKey(nodesQueryKey, toListQueryKey(13))).toBe(false);
  });

  it('distingue deux indicateurs de la même collectivité', () => {
    expect(
      toNodesQueryKey({ listQueryKey: toListQueryKey(12), indicateurId: 6 })
    ).not.toEqual(nodesQueryKey);
  });
});
