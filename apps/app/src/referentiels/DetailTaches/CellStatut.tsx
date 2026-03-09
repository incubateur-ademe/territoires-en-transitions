import {
  ActionTypeEnum,
  statutAvancementIncludingNonConcerneEnumSchema,
} from '@tet/domain/referentiels';
import { SelectActionStatut } from '@/app/referentiels/actions/action-statut/action-statut.select';
import { useEditActionStatutIsDisabled } from '@/app/referentiels/actions/action-statut/use-action-statut';
import { useCallback } from 'react';
import { TCellProps } from './DetailTacheTable';

/** Affiche le sélecteur permettant de mettre à jour le statut d'une tâche */
export const CellStatut = ({ row, value, updateStatut }: TCellProps) => {
  const { actionId, actionType, score } = row.original;
  const concerne = score?.concerne ?? true;
  const isDisabled = useEditActionStatutIsDisabled(actionId);
  const avancementDescendants = row.original.actionsEnfant?.flatMap(
    (a) => (a.score?.avancement ? [a.score.avancement] : [])
  ) ?? [];
  const filled =
    avancementDescendants.filter(
      (av: string) => av !== 'non_renseigne'
    ).length > 0;

  let items = [...statutAvancementIncludingNonConcerneEnumSchema.options];

  if (actionType === ActionTypeEnum.SOUS_ACTION && value !== 'non_renseigne' && filled) {
    items = items.filter((item) => item !== 'non_renseigne');
  }

  if (actionType === ActionTypeEnum.SOUS_ACTION && value !== 'detaille') {
    items = items.filter((item) => item !== 'detaille');
  }

  const handleChange = useCallback(
    (value: string) => {
      const newStatus =
        actionType === ActionTypeEnum.SOUS_ACTION && value === 'detaille'
          ? 'non_renseigne'
          : value;

      updateStatut(actionId, newStatus);

      if (actionType === ActionTypeEnum.TACHE) {
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

  return actionType === ActionTypeEnum.SOUS_ACTION || actionType === ActionTypeEnum.TACHE ? (
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
