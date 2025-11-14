import { useState } from 'react';

import { useCurrentCollectivite } from '@/api/collectivites';
import { FichesActionCountByModule } from '@/app/tableaux-de-bord/plans-action/fiches-action-count-by/fiches-action-count-by.module';
import { ModuleFicheCountBy } from '@/domain/collectivites/tableau-de-bord';

import { BottomOkCancel, ButtonProps, Event, useEventTracker } from '@/ui';
import { useDeleteModule } from '../_hooks/use-delete-module';
import TdbPaFichesActionCountModal from './tdb-pa-fiches-action-count.modal';

type Props = {
  module: ModuleFicheCountBy;
};

const TdbPaFichesActionCountModule = ({ module }: Props) => {
  const tracker = useEventTracker();

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
        onClick: () => {
          setIsEditModalOpen(true);
          tracker(Event.tdb.updateFiltresCountByActions, {
            countByProperty: module.options.countByProperty,
          });
        },
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
        titre={module.titre}
        countByProperty={module.options.countByProperty}
        filters={module.options.filtre}
        menuActions={{
          actions: getMenuActions(),
          enableDownload: !collectivite.isReadOnly,
        }}
        emptyButtons={getEmptyButtons()}
        errorButtons={getEmptyButtons()}
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
