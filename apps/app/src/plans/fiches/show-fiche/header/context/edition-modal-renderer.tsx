import { useCollectiviteId } from '@/api/collectivites';
import {
  makeCollectivitePlanActionUrl,
  makeCollectiviteToutesLesFichesUrl,
} from '@/app/app/paths';
import { DeleteOrRemoveFicheSharingModal } from '@/app/plans/fiches/shared/delete-or-remove-fiche-sharing.modal';
import { FicheWithRelations } from '@/domain/plans';
import { useRouter } from 'next/navigation';
import { AccessRightsManagementModal } from '../menu/actions/acces/access-rights-management.modal';
import { ActivityLogModal } from '../menu/actions/activity-log/activity-log.modal';
import { ModaleEmplacement } from '../menu/actions/emplacement/EmplacementFiche/ModaleEmplacement';
import { ExportFicheModal } from '../menu/actions/pdf-export/ExportModal/export-fa-modal';
import { PilotesDropdownModal } from '../subheader/pilotes/pilotes-dropdown.modal';
import { PriorityDropdownModal } from '../subheader/priority/priority-dropdown.modal';
import { StatusDropdownModal } from '../subheader/status/status-dropdown.modal';
import { useEditionModalManager } from './edition-modal-manager-context';

type EditionModalRendererProps = {
  fiche: FicheWithRelations;
  planId?: number;
};

export const EditionModalRenderer = ({
  fiche,
  planId,
}: EditionModalRendererProps) => {
  const router = useRouter();
  const { currentModal, closeModal } = useEditionModalManager();
  const collectiviteId = useCollectiviteId();

  const redirectPathAfterDelete = planId
    ? makeCollectivitePlanActionUrl({
        collectiviteId: collectiviteId,
        planActionUid: planId.toString(),
      })
    : makeCollectiviteToutesLesFichesUrl({
        collectiviteId: collectiviteId,
      });

  switch (currentModal) {
    case 'emplacement':
      return <ModaleEmplacement fiche={fiche} onClose={closeModal} />;
    case 'export':
      return <ExportFicheModal fiche={fiche} onClose={closeModal} />;
    case 'deleting':
      return (
        <DeleteOrRemoveFicheSharingModal
          fiche={fiche}
          onDeleteCallback={() => router.push(redirectPathAfterDelete)}
          openState={{
            isOpen: true,
            setIsOpen: () => {},
          }}
          //hacky way to hide the button
          //component's API should be improved
          buttonClassName="hidden"
          onClose={closeModal}
        />
      );
    case 'accessRightsManagement':
      return <AccessRightsManagementModal fiche={fiche} onClose={closeModal} />;
    case 'activityLog':
      return <ActivityLogModal fiche={fiche} onClose={closeModal} />;
    case 'piloteInfo':
      return <PilotesDropdownModal fiche={fiche} onClose={closeModal} />;
    case 'status':
      return <StatusDropdownModal fiche={fiche} onClose={closeModal} />;
    case 'priority':
      return <PriorityDropdownModal fiche={fiche} onClose={closeModal} />;
    case 'none':
    default:
      return null;
  }
};
