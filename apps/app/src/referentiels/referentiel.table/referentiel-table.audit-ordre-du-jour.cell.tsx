'use client';

import { appLabels } from '@/app/labels/catalog';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { CellContext } from '@tanstack/react-table';
import { Checkbox } from '@tet/ui';
import { ChangeEvent } from 'react';
import { AuditInputCell } from './audit-input-cell';
import { EmptyCell } from './empty-cell';
import { getTableMeta, isAuditableMesure } from './utils';

type Props = {
  info: CellContext<ActionListItem, unknown>;
};

export const ReferentielTableAuditOrdreDuJourCell = ({ info }: Props) => {
  const action = info.row.original;
  const cellId = info.cell.id;
  const { auditStatutsByMesureId, canUpdateAudit, updateMesureAuditStatut } =
    getTableMeta(info.table);

  const auditStatut = auditStatutsByMesureId?.[action.actionId];

  if (!isAuditableMesure(action, auditStatut)) {
    return <EmptyCell cellId={cellId} />;
  }

  return (
    <AuditInputCell cellId={cellId}>
      <Checkbox
        aria-label={appLabels.auditColonneOrdreDuJour}
        checked={auditStatut.ordreDuJour}
        disabled={!canUpdateAudit}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          updateMesureAuditStatut?.({
            collectiviteId: auditStatut.collectiviteId,
            mesureId: auditStatut.mesureId,
            ordreDuJour: event.currentTarget.checked,
          })
        }
      />
    </AuditInputCell>
  );
};
