'use client';

import { useState } from 'react';

import { useCurrentCollectivite } from '@/api/collectivites';
import { usePlansActionsListe } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlansActionsListe';
import SansPlanPlaceholder from '@/app/tableaux-de-bord/plans-action/sans-plan.placeholder';
import { Button } from '@/ui';

import Modules from './modules';
import TdbPaFichesActionCountModal from './tdb-pa-fiches-action-count.modal';

const TableauDeBordPage = () => {
  const collectivite = useCurrentCollectivite();

  const isAdmin = collectivite.niveauAcces === 'admin';

  const { data: plansActions } = usePlansActionsListe({});

  const [isAddModuleModalOpen, setIsAddModuleModalOpen] = useState(false);

  return (
    <>
      {/** Header */}
      <div className="flex justify-between items-start max-sm:flex-col gap-y-4">
        <h2 className="mb-4">
          Le tableau de bord collaboratif de la collectivité
        </h2>
        {isAdmin && (
          <>
            <Button size="sm" onClick={() => setIsAddModuleModalOpen(true)}>
              Ajouter un module personnalisé
            </Button>
            {isAddModuleModalOpen && (
              <TdbPaFichesActionCountModal
                openState={{
                  isOpen: isAddModuleModalOpen,
                  setIsOpen: setIsAddModuleModalOpen,
                }}
              />
            )}
          </>
        )}
      </div>
      <p className="mb-12 text-lg text-grey-8">
        Ce tableau de bord est destiné à l&apos;ensemble des personnes de la
        collectivité et peut être modifié par les administrateurs.
      </p>
      {/** Contenu principal */}
      {plansActions?.plans.length === 0 ? <SansPlanPlaceholder /> : <Modules />}
    </>
  );
};

export default TableauDeBordPage;
