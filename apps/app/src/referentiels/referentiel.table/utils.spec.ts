import { ActionTypeEnum } from '@tet/domain/referentiels';
import { describe, expect, it } from 'vitest';
import { ActionListItem } from '../actions/use-list-actions';
import { canExpandReferentielTableRow } from './utils';

const action = (
  actionType: ActionListItem['actionType'],
  childrenIds: string[]
) => ({ actionType, childrenIds } as ActionListItem);

describe('canExpandReferentielTableRow', () => {
  it("renvoie false si la ligne n'a pas d'enfant", () => {
    expect(
      canExpandReferentielTableRow(action(ActionTypeEnum.ACTION, []), 'cae')
    ).toBe(false);
  });

  it('renvoie false pour une sous-action sur un nouveau référentiel', () => {
    expect(
      canExpandReferentielTableRow(
        action(ActionTypeEnum.SOUS_ACTION, ['te_1.1.1.1']),
        'te'
      )
    ).toBe(false);
  });

  it('renvoie true pour une sous-action avec tâches sur un ancien référentiel', () => {
    expect(
      canExpandReferentielTableRow(
        action(ActionTypeEnum.SOUS_ACTION, ['cae_1.1.1.1.1']),
        'cae'
      )
    ).toBe(true);
  });

  it('renvoie true si le référentiel est inconnu', () => {
    expect(
      canExpandReferentielTableRow(
        action(ActionTypeEnum.SOUS_ACTION, ['cae_1.1.1.1.1']),
        undefined
      )
    ).toBe(true);
  });
});
