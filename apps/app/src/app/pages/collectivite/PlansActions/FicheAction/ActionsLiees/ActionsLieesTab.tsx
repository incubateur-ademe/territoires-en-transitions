import { useCollectiviteId } from '@/api/collectivites';
import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { useUpdateFiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-update-fiche';
import { SharedFicheLinkedResourcesAlert } from '@/app/plans/fiches/share-fiche/shared-fiche-linked-resources.alert';
import ActionPicto from '@/app/ui/pictogrammes/ActionPicto';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Button, EmptyCard } from '@/ui';
import { useState } from 'react';
import ActionsLieesListe from './ActionsLieesListe';
import ModaleActionsLiees from './ModaleActionsLiees';

type ActionsLieesTabProps = {
  isReadonly: boolean;
  isEditLoading: boolean;
  fiche: Fiche;
};

const ActionsLieesTab = ({
  isReadonly,
  isEditLoading,
  fiche,
}: ActionsLieesTabProps) => {
  const currentCollectiviteId = useCollectiviteId();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { mutate: updateFiche } = useUpdateFiche();

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
              icon={!isEditLoading ? 'link' : undefined}
              size="xs"
              variant="outlined"
              disabled={isEditLoading}
              onClick={() => setIsModalOpen(true)}
            >
              {isEditLoading && <SpinnerLoader className="!h-4" />}
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
          <ActionsLieesListe
            isReadonly={isReadonly}
            externalCollectiviteId={fiche.collectiviteId}
            actionIds={mesures?.map((action) => action.id)}
            className="md:!grid-cols-2 lg:!grid-cols-1 xl:!grid-cols-2"
            onLoad={setIsLoading}
            onUnlink={(actionsLieeId) =>
              updateFiche({
                ficheId: fiche.id,
                ficheFields: {
                  mesures: mesures.filter(
                    (action) => action.id !== actionsLieeId
                  ),
                },
              })
            }
          />
        )}
      </div>

      {isModalOpen && (
        <ModaleActionsLiees
          openState={{ isOpen: isModalOpen, setIsOpen: setIsModalOpen }}
          fiche={fiche}
        />
      )}
    </>
  );
};

export default ActionsLieesTab;
