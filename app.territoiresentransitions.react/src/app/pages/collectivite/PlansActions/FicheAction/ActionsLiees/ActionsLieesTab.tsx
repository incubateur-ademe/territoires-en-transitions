import { FicheAction } from '@/api/plan-actions';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Button, EmptyCard } from '@/ui';
import { useState } from 'react';
import ActionPicto from './ActionPicto';
import ActionsLieesListe from './ActionsLieesListe';
import ModaleActionsLiees from './ModaleActionsLiees';

type ActionsLieesTabProps = {
  isReadonly: boolean;
  isEditLoading: boolean;
  fiche: FicheAction;
  updateFiche: (fiche: FicheAction) => void;
};

const ActionsLieesTab = ({
  isReadonly,
  isEditLoading,
  fiche,
  updateFiche,
}: ActionsLieesTabProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { actions } = fiche;

  const isEmpty = !actions || actions.length === 0;

  return (
    <>
      {isEmpty ? (
        <EmptyCard
          picto={(props) => <ActionPicto {...props} />}
          title="Aucune action des référentiels n'est liée !"
          subTitle="Ici vous pouvez lier votre action avec une action des référentiels Climat Air Energie et Economie Circulaire de l’ADEME"
          isReadonly={isReadonly}
          actions={[
            {
              children: 'Lier une action des référentiels',
              icon: 'link',
              onClick: () => setIsModalOpen(true),
            },
          ]}
          size="xs"
        />
      ) : (
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

          {/* Liste des mesures des référentiels liées */}
          <ActionsLieesListe
            isReadonly={isReadonly}
            actionIds={actions?.map((action) => action.id)}
            className="sm:grid-cols-2 md:grid-cols-3"
            onLoad={setIsLoading}
            onUnlink={(actionsLieeId) =>
              updateFiche({
                ...fiche,
                actions: actions.filter(
                  (action) => action.id !== actionsLieeId
                ),
              })
            }
          />
        </div>
      )}

      <ModaleActionsLiees
        isOpen={isModalOpen && !isReadonly}
        setIsOpen={setIsModalOpen}
        fiche={fiche}
        updateFiche={updateFiche}
      />
    </>
  );
};

export default ActionsLieesTab;
