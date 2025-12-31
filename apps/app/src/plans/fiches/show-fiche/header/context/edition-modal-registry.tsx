import { DeleteOrRemoveFicheSharingModal } from '@/app/plans/fiches/shared/delete-or-remove-fiche-sharing.modal';
import { FicheWithRelations } from '@tet/domain/plans';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { FicheContextValue } from '../../context/fiche-context';
import { ModaleEmplacement } from '../actions/emplacement/EmplacementFiche/ModaleEmplacement';
import { AccessRightsManagementModal } from '../menu/actions/acces/access-rights-management.modal';
import { ActivityLogModal } from '../menu/actions/activity-log/activity-log.modal';
import { ExportFicheModal } from '../menu/actions/pdf-export/ExportModal/export-fa-modal';
import { PilotesDropdownModal } from '../subheader/pilotes/pilotes-dropdown.modal';
import { PriorityDropdownModal } from '../subheader/priority/priority-dropdown.modal';
import { StatusDropdownModal } from '../subheader/status/status-dropdown.modal';
import { ModalType } from './edition-modal-manager-context';

export type EditionModalRendererContext = {
  fiche: FicheWithRelations;
  planId?: number;
  onClose: () => void;
  redirectPathAfterDelete: string;
  updateFiche: FicheContextValue['update'];
  isEditLoading: boolean;
  router: AppRouterInstance;
};

type ModalRenderer = (ctx: EditionModalRendererContext) => JSX.Element | null;

type RegisteredModalType = Exclude<ModalType, 'none'>;

export const modalRegistry: Record<RegisteredModalType, ModalRenderer> = {
  emplacement: ({ fiche, onClose }) => (
    <ModaleEmplacement fiche={fiche} onClose={onClose} />
  ),
  export: ({ fiche, onClose }) => (
    <ExportFicheModal fiche={fiche} onClose={onClose} />
  ),
  deleting: ({ fiche, onClose, redirectPathAfterDelete, router }) => (
    <DeleteOrRemoveFicheSharingModal
      fiche={fiche}
      onDeleteCallback={() => router.push(redirectPathAfterDelete)}
      openState={{
        isOpen: true,
        setIsOpen: () => {},
      }}
      /**
       * hacky way to hide the button since here
       * we don't need to display the button here
       * the component's API should be improved
       */
      buttonClassName="hidden"
      onClose={onClose}
    />
  ),
  accessRightsManagement: ({ fiche, onClose, updateFiche, isEditLoading }) => (
    <AccessRightsManagementModal
      fiche={fiche}
      onClose={onClose}
      onUpdateAccess={(params) =>
        updateFiche({
          ficheId: fiche.id,
          ficheFields: params,
        })
      }
      isUpdatingAccess={isEditLoading}
    />
  ),
  activityLog: ({ fiche, onClose }) => (
    <ActivityLogModal fiche={fiche} onClose={onClose} />
  ),
  pilotes: ({ fiche, onClose }) => (
    <PilotesDropdownModal fiche={fiche} onClose={onClose} />
  ),
  status: ({ fiche, onClose }) => (
    <StatusDropdownModal fiche={fiche} onClose={onClose} />
  ),
  priority: ({ fiche, onClose }) => (
    <PriorityDropdownModal fiche={fiche} onClose={onClose} />
  ),
};
