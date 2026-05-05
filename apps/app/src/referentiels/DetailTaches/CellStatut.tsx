import { isActionStatutEditDisabled } from '@/app/referentiels/actions/action-statut/use-action-statut';
import { useCallback } from 'react';
import { ActionStatutDropdown } from '../actions/action-statut/action-statut.dropdown';
import { TCellProps } from './DetailTacheTable';

/** Affiche le sélecteur permettant de mettre à jour le statut d'une tâche */
export const CellStatut = ({ row, updateStatut, editContext }: TCellProps) => {
  const action = row.original;
  const {
    actionId,
    actionType,
    score: { statut, desactive },
  } = action;
  const isDisabled = isActionStatutEditDisabled(editContext, desactive);

  const handleChange = useCallback(
    (value: string) => {
      const newStatus =
        actionType === 'sous-action' && value === 'detaille'
          ? 'non_renseigne'
          : value;

      updateStatut(actionId, newStatus);

      if (actionType === 'tache') {
        const sousActionId = actionId
          .split('.')
          .slice(0, actionId.split('.').length - 1)
          .join('.');

        setTimeout(() => {
          updateStatut(sousActionId, 'non_renseigne');
        }, 1000);
      }
    },
    [actionId, actionType, updateStatut]
  );

  return actionType === 'sous-action' || actionType === 'tache' ? (
    <div className="ml-auto" onClick={(evt) => evt.stopPropagation()}>
      <ActionStatutDropdown
        action={action}
        disabled={isDisabled}
        value={statut}
        onChange={handleChange}
        small
        buttonClassName="border-none outline-none"
      />
    </div>
  ) : null;
};
