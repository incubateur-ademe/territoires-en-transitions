import { SharedFicheLinkedResourcesAlert } from '@/app/plans/fiches/share-fiche/shared-fiche-linked-resources.alert';
import { useFicheContext } from '@/app/plans/fiches/show-fiche/context/fiche-context';
import ActionPicto from '@/app/ui/pictogrammes/ActionPicto';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Button, EmptyCard } from '@tet/ui';
import { useState } from 'react';
import { MesuresLieesListe } from './mesures-liees.list';
import { MesuresLieesModal } from './mesures-liees.modal';

export const MesuresLieesView = () => {
  const { fiche, isReadonly, isUpdatePending } = useFicheContext();
  const currentCollectiviteId = useCollectiviteId();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { updateFiche } = useFicheContext();

  const { mesures } = fiche;

  const isEmpty = !mesures || mesures.length === 0;

  return (
    <>
      <div className="bg-white border border-grey-3 rounded-lg py-7 lg:py-8 xl:py-10 px-5 lg:px-6 xl:px-8 flex flex-col gap-5">
        {/* Titre et bouton d'édition */}
        <div className="flex justify-between">
          <h5 className="text-primary-8 mb-0">
            Mesures des référentiels liées
          </h5>
          {!isReadonly && !isLoading && (
            <Button
              icon={!isUpdatePending ? 'link' : undefined}
              size="xs"
              variant="outlined"
              disabled={isUpdatePending}
              onClick={() => setIsModalOpen(true)}
            >
              {isUpdatePending && <SpinnerLoader className="!h-4" />}
              Lier une mesure des référentiels
            </Button>
          )}
        </div>
        <SharedFicheLinkedResourcesAlert
          fiche={fiche}
          currentCollectiviteId={currentCollectiviteId}
          sharedDataTitle="Mesures des référentiels liées"
          sharedDataDescription="Les mesures des référentiels liées affichées correspondent à celles de cette collectivité."
        />
        {/* Liste des mesures des référentiels liées */}
        {isEmpty ? (
          <EmptyCard
            picto={(props) => <ActionPicto {...props} />}
            title="Aucune mesure des référentiels n'est liée !"
            subTitle="Ici vous pouvez lier votre action avec une mesure des référentiels Climat Air Energie et Economie Circulaire de l’ADEME"
            isReadonly={isReadonly}
            actions={[
              {
                children: 'Lier une mesure des référentiels',
                icon: 'link',
                onClick: () => setIsModalOpen(true),
              },
            ]}
            size="xs"
          />
        ) : (
          <MesuresLieesListe
            isReadonly={isReadonly}
            externalCollectiviteId={fiche.collectiviteId}
            mesuresIds={mesures?.map((mesure) => mesure.id)}
            className="md:!grid-cols-2 lg:!grid-cols-1 xl:!grid-cols-2"
            onLoad={setIsLoading}
            onUnlink={(mesureId) =>
              updateFiche({
                ficheId: fiche.id,
                ficheFields: {
                  mesures: mesures.filter((mesure) => mesure.id !== mesureId),
                },
              })
            }
          />
        )}
      </div>

      {isModalOpen && (
        <MesuresLieesModal
          openState={{ isOpen: isModalOpen, setIsOpen: setIsModalOpen }}
          fiche={fiche}
        />
      )}
    </>
  );
};
