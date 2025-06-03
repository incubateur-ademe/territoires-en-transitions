import { useState } from 'react';

import { ModuleFicheActionsSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import FichesActionModule from '@/app/tableaux-de-bord/plans-action/fiches-action/fiches-action.module';

import { getQueryKey } from '../_hooks/use-tdb-perso-fetch-modules';
import FichesRecemmentModifieesModal from './fiches-recemment-modifiees.modal';

type Props = {
  module: ModuleFicheActionsSelect;
};

const FichesRecemmentModifieesModule = ({ module }: Props) => {
  const collectiviteId = module.collectiviteId;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <FichesActionModule
        module={module}
        menuActions={[
          {
            label: 'Modifier',
            icon: 'edit-line',
            onClick: () => setIsEditModalOpen(true),
          },
        ]}
        emptyButtons={[
          {
            children: 'Modifier le filtre',
            size: 'sm',
            onClick: () => setIsEditModalOpen(true),
          },
        ]}
        footerLink={makeTdbCollectiviteUrl({
          collectiviteId,
          view: 'personnel',
          module: module.defaultKey,
        })}
      />
      <FichesRecemmentModifieesModal
        module={module}
        openState={{ isOpen: isEditModalOpen, setIsOpen: setIsEditModalOpen }}
        keysToInvalidate={[getQueryKey(collectiviteId)]}
      />
    </>
  );
};

export default FichesRecemmentModifieesModule;
