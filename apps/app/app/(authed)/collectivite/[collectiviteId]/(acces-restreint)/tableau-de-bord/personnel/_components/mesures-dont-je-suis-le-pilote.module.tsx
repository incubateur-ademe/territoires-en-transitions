import { useState } from 'react';

import { MesuresModule } from '@/app/tableaux-de-bord/referentiels/mesures.module';
import { useTRPC } from '@tet/api';
import { ModuleMesuresSelect } from '@tet/domain/metrics';

import { Event, useEventTracker } from '@tet/ui';
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
  const trpc = useTRPC();
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
        keysToInvalidate={[
          trpc.metrics.users.listModules.queryKey({
            collectiviteId: module.collectiviteId,
          }),
        ]}
      />
    </>
  );
};

export default MesuresDontJeSuisLePiloteModule;
