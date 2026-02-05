import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ButtonMenu, Icon } from '@tet/ui';
import {
  ModalType,
  useEditionModalManager,
} from '../context/edition-modal-manager-context';

export const Menu = () => {
  const { openModal } = useEditionModalManager();
  const { hasCollectivitePermission } = useCurrentCollectivite();

  const actions: Array<{
    id: ModalType;
    isVisible?: boolean;
    icon: string;
    label: string;
  }> = [
    {
      id: 'emplacement',
      isVisible: hasCollectivitePermission('plans.mutate'),
      icon: 'folder-2-line',
      label: "Mutualiser l'action dans d'autres plans",
    },
    {
      id: 'accessRightsManagement',
      isVisible: hasCollectivitePermission('plans.fiches.update'),
      icon: 'lock-line',
      label: "Gérer les droits d'accès de l'action",
    },
    {
      id: 'export',
      icon: 'download-line',
      label: "Télécharger l'action",
    },
    {
      id: 'activityLog',
      icon: 'history-line',
      label: "Journal d'activités",
      isVisible: hasCollectivitePermission('collectivites.read'),
    },
    {
      id: 'deleting',
      isVisible: hasCollectivitePermission('plans.fiches.delete'),
      icon: 'delete-bin-6-line',
      label: "Supprimer l'action",
    },
  ];

  const availableActions = actions
    .filter((action) => action.isVisible !== false)
    .map(({ isVisible, ...action }) => action);

  return (
    <ButtonMenu
      menu={{
        actions: availableActions.map((action) => ({
          ...action,
          onClick: () => openModal(action.id),
        })),
      }}
      children={
        <Icon icon="more-line" size="sm" className="h-4 w-4 color-primary-9" />
      }
      className="border-grey-4 border-solid border-2 py-4 px-2 w-9 h-9 rounded-lg flex items-center justify-center bg-white"
      variant="unstyled"
    />
  );
};
