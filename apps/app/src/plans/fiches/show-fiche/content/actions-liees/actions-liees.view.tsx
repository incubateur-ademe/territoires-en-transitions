import { makeCollectiviteActionUrl } from '@/app/app/paths';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { Button } from '@tet/ui';
import { useState } from 'react';
import { useFicheContext } from '../../context/fiche-context';
import { useUpdateFichesActionLiees } from '../../data/useFichesActionLiees';
import { LinkedResources } from '../linked-resources-layout';
import { FicheActionCard } from './Carte/FicheActionCard';
import { FichePicto } from './FichePicto';
import { ModaleFichesLiees } from './ModaleFichesLiees';

export const ActionsLieesView = () => {
  const {
    fiche,
    isReadonly,
    isUpdatePending,
    fichesLiees,
    isLoadingFichesLiees,
  } = useFicheContext();
  const collectivite = useCurrentCollectivite();
  const user = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { mutate: updateFichesActionLiees } = useUpdateFichesActionLiees(
    fiche.id
  );

  return (
    <>
      <LinkedResources.Root>
        <LinkedResources.SharedAlert
          title="Fiches associées"
          description="Les actions affichées correspondent à celles de cette collectivité."
        />
        <LinkedResources.Empty
          picto={(props) => <FichePicto {...props} />}
          title="Cette action n'est liée à aucune autre action"
          subTitle="Lier une action"
          actions={[
            {
              children: 'Lier une fiche action',
              icon: 'link',
              onClick: () => setIsModalOpen(true),
            },
          ]}
        />
        <LinkedResources.Content
          data={fichesLiees}
          isLoading={isLoadingFichesLiees}
          actions={
            !isReadonly && (
              <Button
                icon={!isUpdatePending ? 'link' : undefined}
                size="xs"
                variant="outlined"
                disabled={isUpdatePending}
                onClick={() => setIsModalOpen(true)}
              >
                {isUpdatePending && <SpinnerLoader className="!h-4" />}
                Lier une fiche action
              </Button>
            )
          }
        >
          {(ficheAction) => (
            <FicheActionCard
              key={ficheAction.id}
              ficheAction={ficheAction}
              link={makeCollectiviteActionUrl({
                collectiviteId: collectivite.collectiviteId,
                ficheUid: ficheAction.id.toString(),
              })}
              onUnlink={
                isReadonly
                  ? undefined
                  : () =>
                      updateFichesActionLiees(
                        fichesLiees
                          .filter((f) => f.id !== ficheAction.id)
                          .map((f) => f.id)
                      )
              }
              currentCollectivite={collectivite}
              currentUserId={user.id}
            />
          )}
        </LinkedResources.Content>
      </LinkedResources.Root>

      <ModaleFichesLiees
        isOpen={isModalOpen && !isReadonly}
        setIsOpen={setIsModalOpen}
        currentFicheId={fiche.id}
        linkedFicheIds={fichesLiees.map((f) => f.id)}
        updateLinkedFicheIds={(linkedficheIds) =>
          updateFichesActionLiees(linkedficheIds)
        }
      />
    </>
  );
};
