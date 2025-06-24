import { useState } from 'react';

import { ModuleFicheActionsSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { FichesActionModule } from '@/app/tableaux-de-bord/plans-action/fiches-action/fiches-action.module';
import { Event, useEventTracker } from '@/ui';
import { getQueryKey } from '../_hooks/use-tdb-perso-fetch-modules';
import FichesDontJeSuisLePiloteModal from './fiches-dont-je-suis-le-pilote.modal';

type Props = {
  module: ModuleFicheActionsSelect;
};

const FichesDontJeSuisLePiloteModule = ({ module }: Props) => {
  const collectiviteId = module.collectiviteId;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const tracker = useEventTracker();

  const openFilters = () => {
    setIsEditModalOpen(true);
    tracker(Event.tdb.updateFiltresActionsPilotes);
  };

  return (
    <>
      <FichesActionModule
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
        footerLink={makeTdbCollectiviteUrl({
          collectiviteId,
          view: 'personnel',
          module: module.defaultKey,
        })}
      />
      <FichesDontJeSuisLePiloteModal
        module={module}
        openState={{ isOpen: isEditModalOpen, setIsOpen: setIsEditModalOpen }}
        keysToInvalidate={[getQueryKey(collectiviteId)]}
      />
    </>
  );
};

export default FichesDontJeSuisLePiloteModule;
