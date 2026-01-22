'use client';

import { useState } from 'react';

import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button } from '@tet/ui';

import { useListPlans } from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import { ListPlansEmptyCard } from '@/app/plans/plans/list-all-plans/list-plans.empty-card';
import Modules from './modules';
import TdbPaFichesActionCountModal from './tdb-pa-fiches-action-count.modal';

export const TableauDeBordPage = () => {
  const collectivite = useCurrentCollectivite();

  const canEdit = collectivite.hasCollectivitePermission(
    'collectivites.tableau-de-bord.mutate'
  );

  const { plans } = useListPlans(collectivite.collectiviteId);

  const [isAddModuleModalOpen, setIsAddModuleModalOpen] = useState(false);

  return (
    <>
      <div className="flex justify-between items-start max-sm:flex-col gap-y-4">
        <h2 className="mb-4">Tableau de bord Plans & Actions</h2>
        {canEdit && (
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
      {plans.length === 0 ? (
        <ListPlansEmptyCard collectivite={collectivite} />
      ) : (
        <Modules />
      )}
    </>
  );
};
