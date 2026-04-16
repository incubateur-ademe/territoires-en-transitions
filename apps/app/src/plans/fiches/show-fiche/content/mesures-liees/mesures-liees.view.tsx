import { useFicheContext } from '@/app/plans/fiches/show-fiche/context/fiche-context';
import { appLabels } from '@/app/labels/catalog';
import ActionLinkedCard from '@/app/referentiels/actions/action.linked-card';
import ActionPicto from '@/app/ui/pictogrammes/ActionPicto';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Button } from '@tet/ui';
import { useState } from 'react';
import { useFicheMesures } from '../../context/hooks/use-fiche-mesure';
import { ContentLayout } from '../content-layout';
import { MesuresLieesModal } from './mesures-liees.modal';

export const MesuresLieesView = () => {
  const { fiche, isReadonly } = useFicheContext();
  const mesuresState = useFicheMesures(fiche);

  const currentCollectiviteId = useCollectiviteId();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <ContentLayout.Root>
        <ContentLayout.SharedAlert
          fiche={fiche}
          collectiviteId={currentCollectiviteId}
          title={appLabels.mesuresLiees}
          description={appLabels.mesuresLieesDescription}
        />
        <ContentLayout.Empty
          isReadonly={isReadonly}
          picto={(props) => <ActionPicto {...props} />}
          title={appLabels.aucuneMesureLiee}
          subTitle={appLabels.mesuresLieesEmptyDescription}
          actions={[
            {
              children: appLabels.lierMesureReferentiels,
              icon: 'link',
              onClick: () => setIsModalOpen(true),
            },
          ]}
        />

        <ContentLayout.Content
          data={mesuresState.list ?? []}
          actions={
            <Button icon="link" size="sm" onClick={() => setIsModalOpen(true)}>
              {appLabels.lierMesureReferentiels}
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
