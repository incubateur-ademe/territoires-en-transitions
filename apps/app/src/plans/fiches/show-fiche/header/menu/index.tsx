import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { PermissionOperation } from '@/domain/users';
import { ButtonMenu } from '@/ui/design-system/Button/button-menu';
import {
  ModalType,
  useEditionModalManager,
} from '../context/edition-modal-manager-context';

type MenuProps = {
  permissions: PermissionOperation[];
};

export const Menu = ({ permissions }: MenuProps) => {
  const { openModal } = useEditionModalManager();

  const actions: Array<{
    id: ModalType;
    isVisible?: boolean;
    icon: string;
    label: string;
  }> = [
    {
      id: 'emplacement',
      isVisible: hasPermission(permissions, 'plans.mutate'),
      icon: 'folder-2-line',
      label: "Mutualiser l'action dans d'autres plans",
    },
    {
      id: 'accessRightsManagement',
      isVisible: hasPermission(permissions, 'plans.fiches.update'),
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
    },
    {
      id: 'deleting',
      isVisible: hasPermission(permissions, 'plans.fiches.delete'),
      icon: 'delete-bin-2-line',
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
      children={'...'}
      variant="white"
    />
  );
};
