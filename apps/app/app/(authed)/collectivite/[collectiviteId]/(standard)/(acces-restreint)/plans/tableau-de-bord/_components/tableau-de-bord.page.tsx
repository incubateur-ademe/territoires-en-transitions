'use client';

import { useState } from 'react';

import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button, PageHeader } from '@tet/ui';

import { appLabels } from '@/app/labels/catalog';
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
      <PageHeader>
        <PageHeader.Title>
          {appLabels.tableauDeBordPlansEtActions}
        </PageHeader.Title>
        {canEdit && (
          <PageHeader.Actions>
            <Button size="sm" onClick={() => setIsAddModuleModalOpen(true)}>
              {appLabels.ajouterModulePersonnalise}
            </Button>
          </PageHeader.Actions>
        )}
        <PageHeader.Subtitle>
          <p className="text-lg text-grey-8 mb-0">
            {appLabels.tableauDeBordDestinataires}
          </p>
        </PageHeader.Subtitle>
      </PageHeader>
      {canEdit && isAddModuleModalOpen && (
        <TdbPaFichesActionCountModal
          openState={{
            isOpen: isAddModuleModalOpen,
            setIsOpen: setIsAddModuleModalOpen,
          }}
        />
      )}
      {/** Contenu principal */}
      {plans.length === 0 ? (
        <ListPlansEmptyCard collectivite={collectivite} />
      ) : (
        <Modules />
      )}
    </>
  );
};
