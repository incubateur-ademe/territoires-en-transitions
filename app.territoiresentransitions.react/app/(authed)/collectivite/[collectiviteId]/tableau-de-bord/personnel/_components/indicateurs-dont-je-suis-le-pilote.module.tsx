import { useState } from 'react';

import { ModuleIndicateursSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import IndicateursModule from '@/app/tableaux-de-bord/indicateurs/indicateurs.module';

import { getQueryKey } from '../_hooks/use-tdb-perso-fetch-modules';
import IndicateursDontJeSuisLePiloteModal from './indicateurs-dont-je-suis-le-pilote.modal';

type Props = {
  module: ModuleIndicateursSelect;
};

const IndicateursDontJeSuisLePiloteModule = ({ module }: Props) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <IndicateursModule
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
      />
      {isEditModalOpen && (
        <IndicateursDontJeSuisLePiloteModal
          module={module}
          openState={{
            isOpen: isEditModalOpen,
            setIsOpen: setIsEditModalOpen,
          }}
          keysToInvalidate={[getQueryKey(module.collectiviteId)]}
        />
      )}
    </>
  );
};

export default IndicateursDontJeSuisLePiloteModule;
