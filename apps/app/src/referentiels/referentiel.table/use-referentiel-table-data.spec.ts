import { describe, expect, it } from 'vitest';
import { ActionListItem } from '../actions/use-list-actions';
import { listTopMostActions } from './use-referentiel-table-data';

const action = (actionId: string) => ({ actionId } as ActionListItem);

describe('listTopMostActions', () => {
  it('retire les actions dont un ancêtre est déjà dans la liste', () => {
    expect(
      listTopMostActions([
        action('te_1.1.1'),
        action('te_1.1.1.2'),
        action('te_1.1.1.2.3'),
        action('te_1.1.2'),
        action('te_2.1.1.1'),
      ]).map(({ actionId }) => actionId)
    ).toEqual(['te_1.1.1', 'te_1.1.2', 'te_2.1.1.1']);
  });
});
