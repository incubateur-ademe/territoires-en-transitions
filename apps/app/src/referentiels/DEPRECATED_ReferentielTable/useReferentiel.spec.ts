import { describe, expect, it } from 'vitest';
import { ActionListItem } from '../actions/use-list-actions';
import { getDepth, getRowsByAxe } from './useReferentiel';

const rows = [
  'cae',
  'cae_1',
  'cae_1.1',
  'cae_1.2.3',
  'cae_10',
  'cae_10.1',
  'cae_2',
].map((actionId) => ({ actionId } as ActionListItem));

describe('getRowsByAxe', () => {
  it("renvoie l'axe de la ligne cliquée et ses descendants", () => {
    expect(getRowsByAxe(rows, 'cae_1.2.3').map((r) => r.actionId)).toEqual([
      'cae_1',
      'cae_1.1',
      'cae_1.2.3',
    ]);
  });

  it("n'inclut pas un axe dont l'id commence par celui de l'axe cliqué", () => {
    expect(getRowsByAxe(rows, 'cae_1.1').map((r) => r.actionId)).not.toContain(
      'cae_10.1'
    );
  });
});

describe('getDepth', () => {
  it("calcule la profondeur à partir de l'actionId", () => {
    expect(getDepth('cae_1')).toBe(0);
    expect(getDepth('cae_1.2')).toBe(1);
    expect(getDepth('cae_1.2.3')).toBe(2);
  });
});
