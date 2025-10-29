import { ButtonProps, MenuAction } from '@/ui';

export const getModuleEditActions = (
  isEditionEnabled: boolean,
  onEdit: () => void
) => {
  const menuActions: MenuAction[] = isEditionEnabled
    ? [
        {
          label: 'Modifier',
          icon: 'edit-line',
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
