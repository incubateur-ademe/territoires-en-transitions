import { useState } from 'react';

import { ModuleFicheActionsSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { ModuleParentPage } from '@/app/tableaux-de-bord/modules/module.page';
import FichesActionModulePage from '@/app/tableaux-de-bord/plans-action/fiches-action/fiches-action.module-page';

import FichesDontJeSuisLePiloteModal from '../../_components/fiches-dont-je-suis-le-pilote.modal';
import { getQueryKey as getFetchModulesTdbKey } from '../../_hooks/use-tdb-perso-fetch-modules';
import { getQueryKey as getFetchSingleKey } from '../../_hooks/use-tdb-perso-fetch-single';

type Props = {
  module: ModuleFicheActionsSelect;
  parentPage: ModuleParentPage;
};

const FichesDontJeSuisLePiloteModulePage = ({ module, parentPage }: Props) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <FichesActionModulePage
        module={module}
        parentPage={parentPage}
        onOpenFilterClick={() => {
          setIsEditModalOpen(true);
        }}
      />
      {isEditModalOpen && (
        <FichesDontJeSuisLePiloteModal
          module={module}
          openState={{
            isOpen: isEditModalOpen,
            setIsOpen: setIsEditModalOpen,
          }}
          keysToInvalidate={[
            getFetchSingleKey(module.defaultKey),
            getFetchModulesTdbKey(module.collectiviteId),
          ]}
        />
      )}
    </>
  );
};

export default FichesDontJeSuisLePiloteModulePage;
