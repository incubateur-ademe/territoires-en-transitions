'use client';

import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { ActionAuditStatutBase } from '@/app/referentiels/audits/ActionAuditStatut';
import { CellContext } from '@tanstack/react-table';
import { MesureAuditStatutEnum } from '@tet/domain/referentiels';
import { AuditInputCell } from './audit-input-cell';
import { EmptyCell } from './empty-cell';
import { getTableMeta, isAuditableMesure } from './utils';

type Props = {
  info: CellContext<ActionListItem, unknown>;
};

export const ReferentielTableAuditStatutCell = ({ info }: Props) => {
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
      <ActionAuditStatutBase
        className="-m-1 inline-block"
        auditStatut={auditStatut}
        readonly={!canUpdateAudit}
        onChange={(statut: MesureAuditStatutEnum) =>
          updateMesureAuditStatut?.({
            collectiviteId: auditStatut.collectiviteId,
            mesureId: auditStatut.mesureId,
            statut,
          })
        }
      />
    </AuditInputCell>
  );
};
