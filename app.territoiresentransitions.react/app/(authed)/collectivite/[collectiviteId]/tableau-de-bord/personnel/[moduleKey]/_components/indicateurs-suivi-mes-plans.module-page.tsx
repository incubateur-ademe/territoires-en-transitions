import { useState } from 'react';

import { ModuleIndicateursSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import IndicateursModulePage from '@/app/tableaux-de-bord/indicateurs/indicateurs.module-page';
import { ModuleParentPage } from '@/app/tableaux-de-bord/modules/module.page';

import IndicateursSuiviMesPlansModal from '../../_components/indicateurs-suivi-mes-plans.modal';
import { getQueryKey } from '../../_hooks/use-tdb-perso-fetch-single';

type Props = {
  module: ModuleIndicateursSelect;
  parentPage: ModuleParentPage;
};

const IndicateursSuiviMesPlansModulePage = ({ module, parentPage }: Props) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <IndicateursModulePage
        module={module}
        parentPage={parentPage}
        onOpenFilterClick={() => {
          setIsEditModalOpen(true);
        }}
      />
      {isEditModalOpen && (
        <IndicateursSuiviMesPlansModal
          module={module}
          openState={{
            isOpen: isEditModalOpen,
            setIsOpen: setIsEditModalOpen,
          }}
          keysToInvalidate={[getQueryKey(module.defaultKey)]}
        />
      )}
    </>
  );
};

export default IndicateursSuiviMesPlansModulePage;
