import { useState } from 'react';

import { ModuleMesuresSelect } from '@/api/plan-actions';
import { MesuresModule } from '@/app/tableaux-de-bord/referentiels/mesures.module';

import { Event, useEventTracker } from '@/ui';
import { getQueryKey } from '../_hooks/use-tdb-perso-fetch-modules';
import { getModuleEditActions } from './get-module-edit-actions';
import MesuresDontJeSuisLePiloteModal from './mesures-dont-je-suis-le-pilote.modal';

type Props = {
  module: ModuleMesuresSelect;
  isEditionEnabled: boolean;
};

const MesuresDontJeSuisLePiloteModule = ({
  module,
  isEditionEnabled,
}: Props) => {
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
        {...getModuleEditActions(isEditionEnabled, openFilters)}
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
