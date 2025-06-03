import { useState } from 'react';

import { ModuleFicheActionsSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import FichesActionModule from '@/app/tableaux-de-bord/plans-action/fiches-action/fiches-action.module';
import FichesDontJeSuisLePiloteModal from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/tableau-de-bord/personnel/_components/fiches-dont-je-suis-le-pilote.modal';
import { getQueryKey } from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/tableau-de-bord/personnel/_hooks/use-tdb-perso-fetch-modules';

type Props = {
  module: ModuleFicheActionsSelect;
};

const FichesDontJeSuisLePiloteModule = ({ module }: Props) => {
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
      <FichesDontJeSuisLePiloteModal
        module={module}
        openState={{ isOpen: isEditModalOpen, setIsOpen: setIsEditModalOpen }}
        keysToInvalidate={[getQueryKey(collectiviteId)]}
      />
    </>
  );
};

export default FichesDontJeSuisLePiloteModule;
