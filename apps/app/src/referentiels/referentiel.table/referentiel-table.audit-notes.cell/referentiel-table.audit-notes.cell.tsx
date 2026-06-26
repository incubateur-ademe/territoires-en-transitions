'use client';

import { appLabels } from '@/app/labels/catalog';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { MesureAuditStatutRow } from '@/app/referentiels/audits/use-list-mesure-audit-statuts-grouped-by-id';
import { UpdateMesureAuditStatut } from '@/app/referentiels/audits/use-update-mesure-audit-statut';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { CellContext } from '@tanstack/react-table';
import { cn, RichTextEditor, TableCell } from '@tet/ui';
import { useCallback, useMemo } from 'react';
import { EmptyCell } from '../empty-cell';
import { getAuditNotePreviewContent } from './get-audit-note-preview-content';
import { getTableMeta, isAuditableMesure } from '../utils';

type Props = {
  info: CellContext<ActionListItem, unknown>;
};

const AuditNotesPanelTitle = ({ identifiant }: { identifiant: string }) => (
  <h5 className="text-primary-9 font-bold leading-7 text-xl">
    {identifiant} {appLabels.auditColonneNotes}
  </h5>
);

const AuditNotesPanelEditor = ({
  auditStatut,
  canUpdateAudit,
  updateMesureAuditStatut,
}: {
  auditStatut: MesureAuditStatutRow;
  canUpdateAudit: boolean;
  updateMesureAuditStatut: UpdateMesureAuditStatut;
}) => (
  <div className="px-6 py-4">
    <RichTextEditor
      initialValue={auditStatut.avis}
      disabled={!canUpdateAudit}
      onBlurTextChanged={(value: string) =>
        updateMesureAuditStatut({
          collectiviteId: auditStatut.collectiviteId,
          mesureId: auditStatut.mesureId,
          avis: value,
        })
      }
    />
  </div>
);

function AuditNotesCellContent({
  action,
  cellId,
  auditStatut,
  canUpdateAudit,
  updateMesureAuditStatut,
}: {
  action: ActionListItem;
  cellId: string;
  auditStatut: MesureAuditStatutRow;
  canUpdateAudit: boolean;
  updateMesureAuditStatut: UpdateMesureAuditStatut;
}) {
  const { setPanel, panel } = useSidePanel();

  const isActive =
    panel.isOpen && panel.title === `audit-notes-${action.actionId}`;

  const avisPreview = useMemo(
    () => getAuditNotePreviewContent(auditStatut.avis),
    [auditStatut.avis]
  );

  const toggleNotesPanel = useCallback(() => {
    if (isActive) {
      setPanel({ type: 'close' });
      return;
    }

    setPanel({
      type: 'open',
      title: `audit-notes-${action.actionId}`,
      Title: () => <AuditNotesPanelTitle identifiant={action.identifiant} />,
      content: (
        <AuditNotesPanelEditor
          auditStatut={auditStatut}
          canUpdateAudit={canUpdateAudit}
          updateMesureAuditStatut={updateMesureAuditStatut}
        />
      ),
    });
  }, [isActive, setPanel, action, auditStatut, canUpdateAudit, updateMesureAuditStatut]);

  return (
    <TableCell
      tabIndex={-1}
      data-cell-id={cellId}
      data-inline-edit="true"
      canEdit={canUpdateAudit}
      placeholder={appLabels.ajouterNote}
      className={cn('cursor-pointer', isActive && 'bg-primary-0')}
      onClick={toggleNotesPanel}
    >
      {avisPreview && (
        <span className="block truncate text-sm text-grey-8">
          {avisPreview}
        </span>
      )}
    </TableCell>
  );
}

export const ReferentielTableAuditNotesCell = ({ info }: Props) => {
  const action = info.row.original;
  const cellId = info.cell.id;
  const { auditStatutsByMesureId, canUpdateAudit, updateMesureAuditStatut } =
    getTableMeta(info.table);

  const auditStatut = auditStatutsByMesureId?.[action.actionId];

  if (!isAuditableMesure(action, auditStatut) || !updateMesureAuditStatut) {
    return <EmptyCell cellId={cellId} />;
  }

  return (
    <AuditNotesCellContent
      action={action}
      cellId={cellId}
      auditStatut={auditStatut}
      canUpdateAudit={canUpdateAudit ?? false}
      updateMesureAuditStatut={updateMesureAuditStatut}
    />
  );
};
