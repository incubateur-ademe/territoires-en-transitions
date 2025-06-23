import { useState } from 'react';

import { ModuleMesuresSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { MesuresModule } from '@/app/tableaux-de-bord/referentiels/mesures.module';

import { Event, useEventTracker } from '@/ui';
import { getQueryKey } from '../_hooks/use-tdb-perso-fetch-modules';
import MesuresDontJeSuisLePiloteModal from './mesures-dont-je-suis-le-pilote.modal';

type Props = {
  module: ModuleMesuresSelect;
};

const MesuresDontJeSuisLePiloteModule = ({ module }: Props) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const tracker = useEventTracker();

  const openFilters = () => {
    setIsEditModalOpen(true);
    tracker(Event.tdb.updateFiltresMesures);
  };

  return (
    <>
      <MesuresModule
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
      <MesuresDontJeSuisLePiloteModal
        module={module}
        openState={{ isOpen: isEditModalOpen, setIsOpen: setIsEditModalOpen }}
        keysToInvalidate={[getQueryKey(module.collectiviteId)]}
      />
    </>
  );
};

export default MesuresDontJeSuisLePiloteModule;
