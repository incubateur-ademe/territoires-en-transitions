import { appLabels } from '@/app/labels/catalog';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { CellContext } from '@tanstack/react-table';
import { TableCellRichTextEditor } from '@tet/ui';
import { EmptyCell } from './empty-cell';
import { getTableMeta, isAuditableMesure } from './utils';

type Props = {
  info: CellContext<ActionListItem, unknown>;
};

export const ReferentielTableAuditNotesCell = ({ info }: Props) => {
  const action = info.row.original;
  const cellId = info.cell.id;
  const { auditStatutsByMesureId, canUpdateAudit, updateMesureAuditStatut } =
    getTableMeta(info.table);

  const auditStatut = auditStatutsByMesureId?.[action.actionId];

  if (!updateMesureAuditStatut) {
    return <EmptyCell cellId={cellId} />;
  }

  if (!isAuditableMesure(action, auditStatut)) {
    return <EmptyCell cellId={cellId} />;
  }

  const { avis, collectiviteId, mesureId } = auditStatut;

  return (
    <TableCellRichTextEditor
      tabIndex={-1}
      data-cell-id={cellId}
      canEdit={canUpdateAudit ?? false}
      placeholder={appLabels.ajouterNote}
      initialValue={avis}
      onValueChange={(value) => {
        if (value === avis) {
          return;
        }

        updateMesureAuditStatut({
          collectiviteId,
          mesureId,
          avis: value || '',
        });
      }}
    />
  );
};
