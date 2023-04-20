import {useCallback} from 'react';
import {TCellProps} from './DetailTacheTable';
import {useEditActionStatutIsDisabled} from 'core-logic/hooks/useActionStatut';
import {SelectActionStatut} from 'ui/shared/actions/SelectActionStatut';

/** Affiche le sélecteur permettant de mettre à jour le statut d'une tâche */
export const CellStatut = ({row, value, updateStatut}: TCellProps) => {
  const {have_children, action_id} = row.original;
  const isDisabled = useEditActionStatutIsDisabled(action_id);

  const handleChange = useCallback(
    (value: string) => {
      updateStatut(action_id, value);
    },
    [action_id]
  );

  return have_children ? null : (
    <SelectActionStatut
      disabled={isDisabled}
      value={value}
      onChange={handleChange}
    />
  );
};
