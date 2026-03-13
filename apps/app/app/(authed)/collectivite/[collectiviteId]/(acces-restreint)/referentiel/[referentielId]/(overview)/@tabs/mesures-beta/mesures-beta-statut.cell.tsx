'use client';

import { SelectActionStatut } from '@/app/referentiels/actions/action-statut/action-statut.select';
import { useEditActionStatutIsDisabled } from '@/app/referentiels/actions/action-statut/use-action-statut';
import { statutAvancementIncludingNonConcerneEnumSchema } from '@tet/domain/referentiels';
import { useCallback } from 'react';
import { TableCell } from '@tet/ui';
import type { MesureBetaRow } from './use-mesures-beta-table-data';

type Props = {
  row: MesureBetaRow;
  updateStatut: (actionId: string, avancement: string) => void;
};

export const MesuresBetaStatutCell = ({ row, updateStatut }: Props) => {
  const { action_id, type, concerne, avancement } = row;
  const isDisabled = useEditActionStatutIsDisabled(action_id);
  const value = concerne === false ? 'non_concerne' : avancement;
  const filled =
    row.avancement_descendants?.filter((av) => av !== 'non_renseigne')
      .length ?? 0 > 0;

  let items = [...statutAvancementIncludingNonConcerneEnumSchema.options];

  if (type === 'sous-action' && value !== 'non_renseigne' && filled) {
    items = items.filter((item) => item !== 'non_renseigne');
  }

  if (type === 'sous-action' && value !== 'detaille') {
    items = items.filter((item) => item !== 'detaille');
  }

  const handleChange = useCallback(
    (newValue: string) => {
      const newStatus =
        type === 'sous-action' && newValue === 'detaille'
          ? 'non_renseigne'
          : newValue;

      updateStatut(action_id, newStatus);

      if (type === 'tache') {
        const sousActionId = action_id
          .split('.')
          .slice(0, action_id.split('.').length - 1)
          .join('.');

        setTimeout(() => {
          updateStatut(sousActionId, 'non_renseigne');
        }, 1000);
      }
    },
    [action_id, type, updateStatut]
  );

  if (type !== 'sous-action' && type !== 'tache') {
    return null;
  }

  return (
    <TableCell
      canEdit={!isDisabled}
      edit={{
        renderOnEdit: ({ openState }) => (
          <div className="w-48" onClick={(e) => e.stopPropagation()}>
            <SelectActionStatut
              items={items}
              disabled={isDisabled}
              value={value}
              onChange={(v) => {
                handleChange(v!);
                openState.setIsOpen(false);
              }}
              openState={openState}
            />
          </div>
        ),
      }}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <SelectActionStatut
          items={items}
          disabled={isDisabled}
          value={value}
          onChange={handleChange}
        />
      </div>
    </TableCell>
  );
};
