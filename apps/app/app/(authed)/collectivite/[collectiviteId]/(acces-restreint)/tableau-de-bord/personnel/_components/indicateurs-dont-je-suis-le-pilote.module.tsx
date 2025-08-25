import { useState } from 'react';

import { ModuleIndicateursSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { IndicateursModule } from '@/app/tableaux-de-bord/indicateurs/indicateurs.module';

import { Event, useEventTracker } from '@/ui';
import { getQueryKey } from '../_hooks/use-tdb-perso-fetch-modules';
import IndicateursDontJeSuisLePiloteModal from './indicateurs-dont-je-suis-le-pilote.modal';

type Props = {
  module: ModuleIndicateursSelect;
};

export const IndicateursDontJeSuisLePiloteModule = ({ module }: Props) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const tracker = useEventTracker();

  const openFilters = () => {
    setIsEditModalOpen(true);
    tracker(Event.tdb.updateFiltresIndicateurs);
  };

  return (
    <>
      <IndicateursModule
        module={module}
        menuActions={[
          {
            label: 'Modifier',
            icon: 'edit-line',
            onClick: openFilters,
          },
        ]}
        emptyButtons={[
          {
            children: 'Modifier le filtre',
            size: 'sm',
            onClick: openFilters,
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
