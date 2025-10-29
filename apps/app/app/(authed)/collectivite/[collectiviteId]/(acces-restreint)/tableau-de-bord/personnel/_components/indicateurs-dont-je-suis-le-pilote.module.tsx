import { useState } from 'react';

import { ModuleIndicateursSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { IndicateursModule } from '@/app/tableaux-de-bord/indicateurs/indicateurs.module';

import { Event, useEventTracker } from '@/ui';
import { getQueryKey } from '../_hooks/use-tdb-perso-fetch-modules';
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
          keysToInvalidate={[getQueryKey(module.collectiviteId)]}
        />
      )}
    </>
  );
};
