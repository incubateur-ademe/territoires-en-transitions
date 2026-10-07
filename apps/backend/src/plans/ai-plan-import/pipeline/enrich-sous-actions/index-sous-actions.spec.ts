import { describe, expect, it } from 'vitest';
import {
  createUnenrichedSousAction,
  createEmptyExtractedAction,
  ExtractedAction,
} from '../../models/extracted-action';
import {
  indexSousActions,
  renderSousActionsToEnrich,
} from './index-sous-actions';

const toAction = (titre: string, sousActionTitres: string[]): ExtractedAction =>
  createEmptyExtractedAction({
    axe: 'Axe 1',
    sousAxe: '1.1',
    titre,
    sousActions: sousActionTitres.map(createUnenrichedSousAction),
  });

describe('indexSousActions', () => {
  it('aplatit les sous-actions avec un index global continu et le titre parent', () => {
    const indexed = indexSousActions([
      toAction('Action A', ['a0', 'a1']),
      toAction('Action B', []),
      toAction('Action C', ['c0']),
    ]);

    expect(indexed).toEqual([
      {
        index: 0,
        actionIndex: 0,
        sousActionIndex: 0,
        parentTitre: 'Action A',
        sousAction: createUnenrichedSousAction('a0'),
      },
      {
        index: 1,
        actionIndex: 0,
        sousActionIndex: 1,
        parentTitre: 'Action A',
        sousAction: createUnenrichedSousAction('a1'),
      },
      {
        index: 2,
        actionIndex: 2,
        sousActionIndex: 0,
        parentTitre: 'Action C',
        sousAction: createUnenrichedSousAction('c0'),
      },
    ]);
  });
});

describe('renderSousActionsToEnrich', () => {
  it('rend une ligne par sous-action avec son index et son action parente', () => {
    const indexed = indexSousActions([toAction('Action A', ['a0', 'a1'])]);

    expect(renderSousActionsToEnrich(indexed)).toBe(
      '0 | [Action parente : Action A] a0\n' +
        '1 | [Action parente : Action A] a1'
    );
  });
});
