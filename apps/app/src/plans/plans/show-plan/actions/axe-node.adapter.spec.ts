import { PlanNode } from '@tet/domain/plans';
import { describe, expect, test } from 'vitest';
import { toRootAxeNode } from './axe-node.adapter';

const rootAxe: PlanNode = {
  id: 1,
  nom: 'Plan climat',
  parent: null,
  depth: 0,
  fiches: [],
};

const childAxe: PlanNode = {
  id: 2,
  nom: 'Mobilités',
  parent: 1,
  depth: 1,
  fiches: [],
};

describe('toRootAxeNode', () => {
  test("enracine l'arbre sur l'axe sans parent", () => {
    expect(toRootAxeNode([childAxe, rootAxe])).toEqual({
      axe: { id: 1, nom: 'Plan climat' },
      depth: 0,
      enfants: [
        {
          axe: { id: 2, nom: 'Mobilités' },
          depth: 1,
          enfants: [],
        },
      ],
    });
  });

  test("rend null quand aucun axe n'est racine", () => {
    expect(toRootAxeNode([childAxe])).toBeNull();
  });
});
