'use client';
import { appLabels } from '@/app/labels/catalog';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import { CollectiviteCurrent } from '@tet/api/collectivites';
import { EmptyCard } from '@tet/ui';
import { useState } from 'react';
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
