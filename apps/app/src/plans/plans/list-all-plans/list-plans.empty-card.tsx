'use client';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { CollectiviteAccess } from '@tet/domain/users';
import { EmptyCard } from '@tet/ui';
import { useState } from 'react';
import { CreatePlanModal } from '../create-plan/create-plan.modal';

const ListPlansVisitorEmptyCard = () => (
  <EmptyCard
    picto={(props) => <PictoDashboard {...props} />}
    title="Cette collectivité n'a pas encore de plan"
  />
);

export const ListPlansEmptyCard = ({
  collectivite,
  panierId,
}: {
  collectivite: CollectiviteAccess;
  panierId?: string;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!hasPermission(collectivite.permissions, 'plans.mutate')) {
    return <ListPlansVisitorEmptyCard />;
  }

  return (
    <>
      <EmptyCard
        picto={(props) => <PictoDashboard {...props} />}
        title="Vous n'avez pas encore créé de plan !"
        description={[
          "Vous pouvez créer votre plan, qu'il soit déjà voté ou encore en cours d'élaboration.",
          'Les actions seront modifiables à tout moment et vous pourrez les piloter depuis cette page !',
        ]}
        actions={[
          {
            children: 'Créer un plan',
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
