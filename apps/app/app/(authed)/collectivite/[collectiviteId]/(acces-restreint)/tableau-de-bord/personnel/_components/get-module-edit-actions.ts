import { appLabels } from '@/app/labels/catalog';
import { ButtonProps, MenuAction } from '@tet/ui';

export const getModuleEditActions = (
  isEditionEnabled: boolean,
  onEdit: () => void
) => {
  const menuActions: MenuAction[] = isEditionEnabled
    ? [
        {
          label: appLabels.filtrer,
          onClick: onEdit,
        },
      ]
    : [];
  const emptyButtons: ButtonProps[] = isEditionEnabled
    ? [
        {
          children: 'Modifier le filtre',
          size: 'sm',
          onClick: onEdit,
        },
      ]
    : [];
  return { menuActions, emptyButtons };
};
