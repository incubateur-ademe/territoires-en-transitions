import { useState } from 'react';

import { useCurrentCollectivite } from '@/app/collectivites/collectivite-context';
import FichesActionCountByModule from '@/app/tableaux-de-bord/plans-action/fiches-action-count-by/fiches-action-count-by.module';
import { ModuleFicheActionCountByType } from '@/domain/collectivites';

import { BottomOkCancel, ButtonProps } from '@/ui';
import { useDeleteModule } from '../_hooks/use-delete-module';
import TdbPaFichesActionCountModal from './tdb-pa-fiches-action-count.modal';

type Props = {
  module: ModuleFicheActionCountByType;
};

const TdbPaFichesActionCountModule = ({ module }: Props) => {
  const collectivite = useCurrentCollectivite();

  const { mutate: deleteModule } = useDeleteModule();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const canEdit = collectivite.niveauAcces === 'admin';

  const canDelete = canEdit && !module.defaultKey;

  const getMenuActions = () => {
    const actions = [];
    if (canEdit) {
      actions.push({
        label: 'Modifier',
        icon: 'edit-line',
        onClick: () => setIsEditModalOpen(true),
      });
    }
    if (canDelete) {
      actions.push({
        label: 'Supprimer le module',
        icon: 'delete-bin-line',
        onClick: () => setIsConfirmDeleteOpen(true),
      });
    }
    return actions;
  };

  const getEmptyButtons = () => {
    const buttons: ButtonProps[] = [];
    if (canEdit) {
      buttons.push({
        children: 'Modifier le filtre',
        size: 'sm',
        onClick: () => setIsEditModalOpen(true),
      });
    }
    if (canDelete) {
      buttons.push({
        children: 'Supprimer le module',
        size: 'sm',
        variant: 'outlined',
        onClick: () => setIsConfirmDeleteOpen(true),
      });
    }
    return buttons;
  };

  return (
    <>
      <FichesActionCountByModule
        key={module.id}
        module={module}
        menuActions={{
          actions: getMenuActions(),
          enableDownload: !collectivite.isReadOnly,
        }}
        emptyButtons={getEmptyButtons()}
      />
      {isEditModalOpen && (
        <TdbPaFichesActionCountModal
          module={module}
          openState={{
            isOpen: isEditModalOpen,
            setIsOpen: setIsEditModalOpen,
          }}
        />
      )}
      {isConfirmDeleteOpen && (
        <BottomOkCancel
          title={`Confirmer la suppression du module : ${module.titre}`}
          btnOKProps={{
            onClick: () => {
              deleteModule({
                collectiviteId: collectivite.collectiviteId,
                moduleId: module.id,
              });
              setIsConfirmDeleteOpen(false);
            },
          }}
          btnCancelProps={{
            onClick: () => {
              setIsConfirmDeleteOpen(false);
            },
          }}
        />
      )}
    </>
  );
};

export default TdbPaFichesActionCountModule;
