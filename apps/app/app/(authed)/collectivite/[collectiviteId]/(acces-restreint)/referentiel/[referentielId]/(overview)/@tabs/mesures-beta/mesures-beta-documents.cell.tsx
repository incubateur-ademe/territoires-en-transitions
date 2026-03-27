'use client';

import ActionPreuvePanel from '@/app/referentiels/actions/action-preuve.panel';
import { ActionProvider } from '@/app/referentiels/actions/action-context';
import { ReferentielProvider } from '@/app/referentiels/referentiel-context';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { useActionPreuvesCount } from '@/app/referentiels/preuves/usePreuves';
import { ReferentielId } from '@tet/domain/referentiels';
import { Button, Icon } from '@tet/ui';
import type { MesureBetaRow } from './use-mesures-beta-table-data';

type Props = {
  row: MesureBetaRow;
  referentielId: ReferentielId;
};

export const MesuresBetaDocumentsCell = ({ row, referentielId }: Props) => {
  const { setPanel, setTitle } = useSidePanel();
  const preuvesCount = useActionPreuvesCount(row.action_id);

  const action = {
    id: row.action_id,
    identifiant: row.identifiant,
    referentiel: referentielId,
  };

  const openDocumentsPanel = () => {
    setTitle(`Documents - ${row.identifiant} ${row.nom}`);
    setPanel({
      type: 'open',
      title: `Documents - ${row.identifiant}`,
      content: (
        <ReferentielProvider referentielId={referentielId}>
          <ActionProvider actionId={row.action_id}>
            <ActionPreuvePanel
              action={action}
              withSubActions
              showWarning
              displayInPanel
            />
          </ActionProvider>
        </ReferentielProvider>
      ),
    });
  };

  return (
    <td className="px-4 py-3">
      <Button
        variant="grey"
        size="sm"
        icon="file-list-3-line"
        onClick={(e) => {
          e.stopPropagation();
          openDocumentsPanel();
        }}
      >
        {preuvesCount > 0 ? (
          <>
            <Icon icon="file-list-3-line" size="sm" className="mr-1" />
            {preuvesCount}
          </>
        ) : (
          'Documents'
        )}
      </Button>
    </td>
  );
};
