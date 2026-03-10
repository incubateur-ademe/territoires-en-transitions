import { SelectActionStatut } from '@/app/referentiels/actions/action-statut/action-statut.select';
import { useEditActionStatutIsDisabled } from '@/app/referentiels/actions/action-statut/use-action-statut';
import {
  StatutAvancementEnum,
  statutAvancementEnumCreateSchema,
} from '@tet/domain/referentiels';
import { useCallback } from 'react';
import { TCellProps } from './DetailTacheTable';

/** Affiche le sélecteur permettant de mettre à jour le statut d'une tâche */
export const CellStatut = ({ row, value, updateStatut }: TCellProps) => {
  const {
    actionId,
    actionType,
    score: { concerne },
  } = row.original;
  const isDisabled = useEditActionStatutIsDisabled(actionId);
  const filled =
    row.original.actionsEnfant?.filter(
      (a) =>
        a.score.avancement &&
        a.score.avancement !== StatutAvancementEnum.NON_RENSEIGNE
    ).length > 0;

  let items = [...statutAvancementEnumCreateSchema.options];

  if (actionType === 'sous-action' && value !== 'non_renseigne' && filled) {
    items = items.filter((item) => item !== 'non_renseigne');
  }

  if (actionType === 'sous-action' && value !== 'detaille') {
    items = items.filter((item) => item !== 'detaille');
  }

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

        // Le setTimeout évite des problèmes de raffraichissement
        setTimeout(() => {
          updateStatut(sousActionId, 'non_renseigne');
        }, 1000);
      }
    },
    [actionId, actionType, updateStatut]
  );

  return actionType === 'sous-action' || actionType === 'tache' ? (
    <div className="ml-auto" onClick={(evt) => evt.stopPropagation()}>
      <SelectActionStatut
        items={items}
        disabled={isDisabled}
        value={concerne === false ? 'non_concerne' : value}
        onChange={handleChange}
      />
    </div>
  ) : null;
};
