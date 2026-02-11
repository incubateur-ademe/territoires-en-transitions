import { useFicheContext } from '@/app/plans/fiches/show-fiche/context/fiche-context';
import ActionLinkedCard from '@/app/referentiels/actions/action.linked-card';
import ActionPicto from '@/app/ui/pictogrammes/ActionPicto';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Button } from '@tet/ui';
import { useState } from 'react';
import { ContentLayout } from '../content-layout';
import { MesuresLieesModal } from './mesures-liees.modal';

export const MesuresLieesView = () => {
  const { fiche, isReadonly, mesures: mesuresState } = useFicheContext();
  const currentCollectiviteId = useCollectiviteId();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <ContentLayout.Root>
        <ContentLayout.SharedAlert
          fiche={fiche}
          collectiviteId={currentCollectiviteId}
          title="Mesures des référentiels liées"
          description="Les mesures des référentiels liées affichées correspondent à celles de cette collectivité."
        />
        <ContentLayout.Empty
          isReadonly={isReadonly}
          picto={(props) => <ActionPicto {...props} />}
          title="Aucune mesure des référentiels n'est liée !"
          subTitle="Ici vous pouvez lier votre action avec une mesure des référentiels Climat Air Energie et Economie Circulaire de l’ADEME"
          actions={[
            {
              children: 'Lier une mesure des référentiels',
              icon: 'link',
              onClick: () => setIsModalOpen(true),
            },
          ]}
        />

        <ContentLayout.Content
          data={mesuresState.list ?? []}
          actions={
            <Button icon="link" size="sm" onClick={() => setIsModalOpen(true)}>
              Lier une mesure des référentiels
            </Button>
          }
        >
          {(mesure) => (
            <ActionLinkedCard
              key={mesure.actionId}
              isReadonly={isReadonly}
              action={mesure}
              onUnlink={() => mesuresState.unlinkMesure(mesure.actionId)}
            />
          )}
        </ContentLayout.Content>
      </ContentLayout.Root>
      {isModalOpen && (
        <MesuresLieesModal
          openState={{ isOpen: isModalOpen, setIsOpen: setIsModalOpen }}
          fiche={fiche}
        />
      )}
    </>
  );
};
