import { useState } from 'react';

import { ModuleIndicateursSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import IndicateursModule from '@/app/tableaux-de-bord/indicateurs/indicateurs.module';

import { getQueryKey } from '../_hooks/use-tdb-perso-fetch-modules';
import IndicateursSuiviMesPlansModal from './indicateurs-suivi-mes-plans.modal';

type Props = {
  module: ModuleIndicateursSelect;
};

const IndicateursSuiviMesPlansModule = ({ module }: Props) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <IndicateursModule
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
      />
      {isEditModalOpen && (
        <IndicateursSuiviMesPlansModal
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

export default IndicateursSuiviMesPlansModule;
