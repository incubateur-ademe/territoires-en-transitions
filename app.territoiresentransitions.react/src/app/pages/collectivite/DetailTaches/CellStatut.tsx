import {useCallback} from 'react';
import {TCellProps} from './DetailTacheTable';
import {useEditActionStatutIsDisabled} from 'core-logic/hooks/useActionStatut';
import {
  DEFAULT_ITEMS,
  SelectActionStatut,
} from 'ui/shared/actions/SelectActionStatut';

/** Affiche le sélecteur permettant de mettre à jour le statut d'une tâche */
export const CellStatut = ({row, value, updateStatut}: TCellProps) => {
  const {action_id, type} = row.original;
  const isDisabled = useEditActionStatutIsDisabled(action_id);
  const filled =
    row.original.avancement_descendants?.filter(av => av !== 'non_renseigne')
      .length > 0;

  let items = DEFAULT_ITEMS;

  if (type === 'sous-action' && value !== 'non_renseigne' && filled) {
    items = items.filter(item => item !== 'non_renseigne');
  }

  if (type === 'sous-action' && value !== 'detaille') {
    items = items.filter(item => item !== 'detaille');
  }

  const handleChange = useCallback(
    (value: string) => {
      const newStatus =
        type === 'sous-action' && value === 'detaille'
          ? 'non_renseigne'
          : value;

      updateStatut(action_id, newStatus);

      if (type === 'tache') {
        const sousActionId = action_id
          .split('.')
          .slice(0, action_id.split('.').length - 1)
          .join('.');

        // Le setTimeout évite des problèmes de raffraichissement
        setTimeout(() => {
          updateStatut(sousActionId, 'non_renseigne');
        }, 1000);
      }
    },
    [action_id]
  );

  return type === 'sous-action' || type === 'tache' ? (
    <div className="ml-auto" onClick={evt => evt.stopPropagation()}>
      <SelectActionStatut
        items={items}
        disabled={isDisabled}
        value={value}
        onChange={handleChange}
      />
    </div>
  ) : null;
};
