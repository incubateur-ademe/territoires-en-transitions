'use client';
import { appLabels } from '@/app/labels/catalog';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import { CollectiviteCurrent } from '@tet/api/collectivites';
import { EmptyCard } from '@tet/ui';
import { useState } from 'react';
import { DemarchePcaetBanner } from '@/app/demarches/pcaet/components/demarche-pcaet-banner';
import { CreatePlanModal } from '../create-plan/create-plan.modal';

const ListPlansVisitorEmptyCard = () => (
  <EmptyCard
    picto={(props) => <PictoDashboard {...props} />}
    title={appLabels.collectiviteSansPlan}
  />
);

export const ListPlansEmptyCard = ({
  collectivite,
  panierId,
}: {
  collectivite: CollectiviteCurrent;
  panierId?: string;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!collectivite.hasCollectivitePermission('plans.mutate')) {
    return <ListPlansVisitorEmptyCard />;
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <DemarchePcaetBanner collectiviteId={collectivite.collectiviteId} />
        <EmptyCard
          picto={(props) => <PictoDashboard {...props} />}
          title={appLabels.utilisateurSansPlan}
          description={[
            appLabels.utilisateurSansPlanDescription,
            appLabels.utilisateurSansPlanDescriptionSuite,
          ]}
          actions={[
            {
              children: appLabels.creerPlan,
              onClick: () => setIsModalOpen(true),
            },
          ]}
        />
      </div>

      {isModalOpen && (
        <CreatePlanModal
          collectiviteId={collectivite.collectiviteId}
          panierId={panierId}
          openState={{
            isOpen: isModalOpen,
            setIsOpen: setIsModalOpen,
          }}
        />
      )}
    </>
  );
};
