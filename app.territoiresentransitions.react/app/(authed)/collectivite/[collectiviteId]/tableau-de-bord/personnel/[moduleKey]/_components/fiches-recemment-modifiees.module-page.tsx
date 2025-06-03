import { useState } from 'react';

import { ModuleFicheActionsSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { ModuleParentPage } from '@/app/tableaux-de-bord/modules/module.page';
import FichesActionModulePage from '@/app/tableaux-de-bord/plans-action/fiches-action/fiches-action.module-page';

import FichesRecemmentModifieesModal from '../../_components/fiches-recemment-modifiees.modal';
import { getQueryKey as getFetchModulesTdbKey } from '../../_hooks/use-tdb-perso-fetch-modules';
import { getQueryKey as getFetchSingleKey } from '../../_hooks/use-tdb-perso-fetch-single';

type Props = {
  module: ModuleFicheActionsSelect;
  parentPage: ModuleParentPage;
};

const FichesRecemmentModifieesModulePage = ({ module, parentPage }: Props) => {
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
        <FichesRecemmentModifieesModal
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

export default FichesRecemmentModifieesModulePage;
