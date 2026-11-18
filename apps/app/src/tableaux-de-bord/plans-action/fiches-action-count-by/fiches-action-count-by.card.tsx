import { appLabels } from '@/app/labels/catalog';
import { ModuleFicheCountBy } from '@tet/domain/metrics';
import { BottomOkCancel, ButtonProps, MenuAction, ModalProps } from '@tet/ui';
import { ReactNode, useState } from 'react';
import { FichesActionCountByModule } from './fiches-action-count-by.module';

export const FichesActionCountByCard = ({
  module,
  canEdit,
  onEditOpen,
  onDelete,
  renderEditModal,
}: {
  module: ModuleFicheCountBy;
  canEdit: boolean;
  onEditOpen?: () => void;
  onDelete: () => void;
  renderEditModal: (openState: ModalProps['openState']) => ReactNode;
}) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const canDelete = canEdit && !module.defaultKey;

  const openEdit = () => {
    setIsEditOpen(true);
    onEditOpen?.();
  };

  const menuActions: MenuAction[] = [
    ...(canEdit
      ? [
          {
            label: appLabels.modifier,
            icon: 'edit-line' as const,
            onClick: openEdit,
          },
        ]
      : []),
    ...(canDelete
      ? [
          {
            label: appLabels.moduleCountBySupprimer,
            icon: 'delete-bin-line' as const,
            onClick: () => setIsConfirmDeleteOpen(true),
          },
        ]
      : []),
  ];

  const emptyButtons: ButtonProps[] = [
    ...(canEdit
      ? [
          {
            children: appLabels.moduleCountByModifierLeFiltre,
            size: 'sm' as const,
            onClick: () => setIsEditOpen(true),
          },
        ]
      : []),
    ...(canDelete
      ? [
          {
            children: appLabels.moduleCountBySupprimer,
            size: 'sm' as const,
            variant: 'outlined' as const,
            onClick: () => setIsConfirmDeleteOpen(true),
          },
        ]
      : []),
  ];

  return (
    <>
      <FichesActionCountByModule
        titre={module.titre}
        countByProperty={module.options.countByProperty}
        filters={module.options.filtre}
        menuActions={{ actions: menuActions }}
        emptyButtons={emptyButtons}
        errorButtons={emptyButtons}
      />
      {isEditOpen &&
        renderEditModal({ isOpen: isEditOpen, setIsOpen: setIsEditOpen })}
      {isConfirmDeleteOpen && (
        <BottomOkCancel
          title={appLabels.moduleCountByConfirmerSuppression(module.titre)}
          btnOKProps={{
            onClick: () => {
              onDelete();
              setIsConfirmDeleteOpen(false);
            },
          }}
          btnCancelProps={{ onClick: () => setIsConfirmDeleteOpen(false) }}
        />
      )}
    </>
  );
};
