'use client';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import { useIsVisitor } from '@/app/users/authorizations/use-is-visitor';
import { EmptyCard } from '@tet/ui';
import { useState } from 'react';
import { CreatePlanModal } from '../create-plan/create-plan.modal';

const ListPlansVisitorEmptyCard = () => (
  <EmptyCard
    picto={() => <PictoDashboard height="160" width="160" />}
    title="Cette collectivité n'a pas encore de plan"
  />
);

export const ListPlansEmptyCard = ({
  collectiviteId,
  panierId,
}: {
  collectiviteId: number;
  panierId?: string;
}) => {
  const isVisitor = useIsVisitor();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isVisitor) {
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
          collectiviteId={collectiviteId}
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
