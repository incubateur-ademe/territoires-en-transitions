import {
  ActionTypeEnum,
  StatutAvancement,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { describe, expect, it } from 'vitest';
import { ActionListItem } from '../actions/use-list-actions';
import { removeStalePendingDetailleALaTache } from './remove-stale-pending-detaille-a-la-tache';

const sousAction = (
  actionId: string,
  statut: StatutAvancement = StatutAvancementEnum.NON_RENSEIGNE
): ActionListItem =>
  ({
    actionId,
    actionType: ActionTypeEnum.SOUS_ACTION,
    score: { statut },
  } as unknown as ActionListItem);

describe('removeStalePendingDetailleALaTache', () => {
  it('garde le flag tant que le backend n’affiche pas encore le statut', () => {
    const pending = { 'cae_1.1.1': true };
    const actions = { 'cae_1.1.1': sousAction('cae_1.1.1') };

    expect(removeStalePendingDetailleALaTache(pending, actions)).toBe(pending);
  });

  it('retire le flag quand le backend affiche "détaillé à la tâche"', () => {
    const actions = {
      'cae_1.1.1': sousAction(
        'cae_1.1.1',
        StatutAvancementEnum.DETAILLE_A_LA_TACHE
      ),
      'cae_1.1.2': sousAction('cae_1.1.2'),
    };

    expect(
      removeStalePendingDetailleALaTache(
        { 'cae_1.1.1': true, 'cae_1.1.2': true },
        actions
      )
    ).toEqual({ 'cae_1.1.2': true });
  });

  it('retire le flag d’une ligne disparue', () => {
    expect(
      removeStalePendingDetailleALaTache({ 'cae_1.1.1': true }, {})
    ).toEqual({});
  });

  it('retire le flag d’une ligne qui n’est plus une sous-action', () => {
    const actions = {
      'cae_1.1': {
        ...sousAction('cae_1.1'),
        actionType: ActionTypeEnum.ACTION,
      } as ActionListItem,
    };

    expect(
      removeStalePendingDetailleALaTache({ 'cae_1.1': true }, actions)
    ).toEqual({});
  });
});
