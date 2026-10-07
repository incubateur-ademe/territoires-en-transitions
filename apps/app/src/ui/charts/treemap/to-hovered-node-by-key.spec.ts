import { describe, expect, it } from 'vitest';
import {
  toGroupKey,
  toHoveredNodeByKey,
  toTileKey,
} from './to-hovered-node-by-key';
import type { TreemapGroup } from './treemap-group';

const BATIMENTS: TreemapGroup<'faible' | 'fort'> = {
  id: 'batiments',
  label: 'Sobriété des bâtiments',
  color: '#8dd3c7',
  tiles: [
    { id: 'financement', label: 'Financement', value: 20, intensity: 'fort' },
  ],
};

const MOBILITE: TreemapGroup<'faible' | 'fort'> = {
  id: 'mobilite',
  label: 'Véhicules électriques',
  color: '#bebada',
  tiles: [
    { id: 'financement', label: 'Financement', value: 8, intensity: 'faible' },
  ],
};

describe('toHoveredNodeByKey', () => {
  it('keeps two tiles sharing an id apart when they belong to different groups', () => {
    const nodes = toHoveredNodeByKey([BATIMENTS, MOBILITE]);

    expect([
      nodes.get(toTileKey({ group: BATIMENTS, tile: BATIMENTS.tiles[0] })),
      nodes.get(toTileKey({ group: MOBILITE, tile: MOBILITE.tiles[0] })),
    ]).toEqual([
      { kind: 'tile', group: BATIMENTS, tile: BATIMENTS.tiles[0] },
      { kind: 'tile', group: MOBILITE, tile: MOBILITE.tiles[0] },
    ]);
  });

  it('resolves a group header to its group', () => {
    expect(toHoveredNodeByKey([BATIMENTS]).get(toGroupKey(BATIMENTS))).toEqual({
      kind: 'group',
      group: BATIMENTS,
    });
  });

  it('resolves a tile to its own id and to the id of its group', () => {
    const node = toHoveredNodeByKey([BATIMENTS, MOBILITE]).get(
      toTileKey({ group: MOBILITE, tile: MOBILITE.tiles[0] })
    );

    expect(node?.kind === 'tile' && [node.group.id, node.tile.id]).toEqual([
      'mobilite',
      'financement',
    ]);
  });

  it('does not confuse a group with a tile whose id matches the group id', () => {
    const homonyme: TreemapGroup<'faible' | 'fort'> = {
      ...BATIMENTS,
      tiles: [{ ...BATIMENTS.tiles[0], id: 'batiments' }],
    };

    expect(toHoveredNodeByKey([homonyme]).size).toBe(2);
  });
});
