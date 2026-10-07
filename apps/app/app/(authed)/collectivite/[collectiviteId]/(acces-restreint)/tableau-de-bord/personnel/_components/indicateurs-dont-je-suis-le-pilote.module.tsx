import { useState } from 'react';

import { IndicateursModule } from '@/app/tableaux-de-bord/indicateurs/indicateurs.module';
import { useTRPC } from '@tet/api';
import { ModuleIndicateursSelect } from '@tet/domain/metrics';

import { Event, useEventTracker } from '@tet/ui';
import { getModuleEditActions } from './get-module-edit-actions';
import IndicateursDontJeSuisLePiloteModal from './indicateurs-dont-je-suis-le-pilote.modal';

type Props = {
  module: ModuleIndicateursSelect;
  isEditionEnabled: boolean;
};

export const IndicateursDontJeSuisLePiloteModule = ({
  module,
  isEditionEnabled,
}: Props) => {
  const trpc = useTRPC();
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
        {...getModuleEditActions(isEditionEnabled, openFilters)}
      />
      {isEditModalOpen && (
        <IndicateursDontJeSuisLePiloteModal
          module={module}
          openState={{
            isOpen: isEditModalOpen,
            setIsOpen: setIsEditModalOpen,
          }}
          keysToInvalidate={[
            trpc.metrics.users.listModules.queryKey({
              collectiviteId: module.collectiviteId,
            }),
          ]}
        />
      )}
    </>
  );
};
