import { describe, expect, it } from 'vitest';
import {
  ExpandableRow,
  getExpandedStateByLevel,
  listExpandableRows,
} from './toggle-rows-expanded-by-level';

type Node = { id: string; children: Node[] };

const node = (id: string, children: Node[] = []): Node => ({ id, children });

// 2 axes, chacun avec 2 sous-niveaux dépliables
const roots = [
  node('cae_1', [
    node('cae_1.1', [node('cae_1.1.1', [node('cae_1.1.1.1')])]),
    node('cae_1.2', [node('cae_1.2.1', [node('cae_1.2.1.1')])]),
  ]),
  node('cae_2', [node('cae_2.1', [node('cae_2.1.1', [node('cae_2.1.1.1')])])]),
];

const rows: ExpandableRow[] = listExpandableRows({
  roots,
  getId: ({ id }) => id,
  getChildren: ({ children }) => children,
  canExpand: ({ children }) => children.length > 0,
});

describe('listExpandableRows', () => {
  it('liste les lignes dépliables avec leur profondeur et leur axe', () => {
    expect(rows).toEqual([
      { id: 'cae_1', depth: 0, axeId: 'cae_1' },
      { id: 'cae_1.1', depth: 1, axeId: 'cae_1' },
      { id: 'cae_1.1.1', depth: 2, axeId: 'cae_1' },
      { id: 'cae_1.2', depth: 1, axeId: 'cae_1' },
      { id: 'cae_1.2.1', depth: 2, axeId: 'cae_1' },
      { id: 'cae_2', depth: 0, axeId: 'cae_2' },
      { id: 'cae_2.1', depth: 1, axeId: 'cae_2' },
      { id: 'cae_2.1.1', depth: 2, axeId: 'cae_2' },
    ]);
  });

  it("n'explore pas les descendants d'une ligne non dépliable", () => {
    const result = listExpandableRows({
      roots,
      getId: ({ id }) => id,
      getChildren: ({ children }) => children,
      canExpand: ({ id, children }) => children.length > 0 && id !== 'cae_2.1',
    });
    expect(result.map(({ id }) => id)).not.toContain('cae_2.1.1');
  });
});

describe('getExpandedStateByLevel', () => {
  const axesExpanded = { cae_1: true, cae_2: true };

  it("déplie les lignes de même niveau de l'axe (scope axe)", () => {
    expect(
      getExpandedStateByLevel({
        rows,
        expanded: axesExpanded,
        clickedId: 'cae_1.1',
        scope: 'axe',
      })
    ).toEqual({ cae_1: true, 'cae_1.1': true, 'cae_1.2': true, cae_2: true });
  });

  it('déplie les lignes de même niveau de tous les axes (scope all)', () => {
    expect(
      getExpandedStateByLevel({
        rows,
        expanded: { cae_1: true },
        clickedId: 'cae_1.1',
        scope: 'all',
      })
    ).toEqual({
      cae_1: true,
      'cae_1.1': true,
      'cae_1.2': true,
      cae_2: true,
      'cae_2.1': true,
    });
  });

  it('replie les lignes plus profondes du périmètre lors du dépliage', () => {
    expect(
      getExpandedStateByLevel({
        rows,
        expanded: { ...axesExpanded, 'cae_1.2': true, 'cae_1.2.1': true },
        clickedId: 'cae_1.1',
        scope: 'axe',
      })
    ).toEqual({ cae_1: true, 'cae_1.1': true, 'cae_1.2': true, cae_2: true });
  });

  it.each(['axe', 'all'] as const)(
    'replie les lignes de même niveau et plus profondes de tous les axes (scope %s)',
    (scope) => {
      expect(
        getExpandedStateByLevel({
          rows,
          expanded: {
            ...axesExpanded,
            'cae_1.1': true,
            'cae_1.1.1': true,
            'cae_1.2': true,
            'cae_2.1': true,
          },
          clickedId: 'cae_1.1',
          scope,
        })
      ).toEqual(axesExpanded);
    }
  );

  it('gère l\'état "tout déplié" (true)', () => {
    expect(
      getExpandedStateByLevel({
        rows,
        expanded: true,
        clickedId: 'cae_1.1',
        scope: 'axe',
      })
    ).toEqual(axesExpanded);
  });

  it("renvoie l'état inchangé si la ligne cliquée n'est pas dépliable", () => {
    expect(
      getExpandedStateByLevel({
        rows,
        expanded: axesExpanded,
        clickedId: 'cae_1.1.1.1',
        scope: 'all',
      })
    ).toEqual(axesExpanded);
  });
});
