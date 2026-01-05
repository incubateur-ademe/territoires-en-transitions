import { SharedFicheLinkedResourcesAlert } from '@/app/plans/fiches/share-fiche/shared-fiche-linked-resources.alert';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { Button, EmptyCard } from '@tet/ui';
import { useState } from 'react';
import { useFicheContext } from '../../context/fiche-context';
import {
  useFichesActionLiees,
  useUpdateFichesActionLiees,
} from '../../data/useFichesActionLiees';
import { FichePicto } from './FichePicto';
import { FichesLieesListe } from './FichesLieesListe';
import { ModaleFichesLiees } from './ModaleFichesLiees';

export const ActionsLieesView = () => {
  const { fiche, isReadonly, isUpdatePending } = useFicheContext();
  const currentCollectivite = useCurrentCollectivite();
  const user = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { fiches: fichesLiees, isLoading } = useFichesActionLiees({
    ficheId: fiche.id,
    collectiviteId: currentCollectivite.collectiviteId,
  });
  const { mutate: updateFichesActionLiees } = useUpdateFichesActionLiees(
    fiche.id
  );

  const isEmpty = !fichesLiees || fichesLiees.length === 0;

  return (
    <>
      {/* Titre et bouton d'édition */}
      <div className="flex justify-between">
        <h5 className="text-primary-8 mb-0">Action liées</h5>
        {!isReadonly && (
          <Button
            icon={!isUpdatePending ? 'link' : undefined}
            size="xs"
            variant="outlined"
            disabled={isUpdatePending}
            onClick={() => setIsModalOpen(true)}
          >
            {isUpdatePending && <SpinnerLoader className="!h-4" />}
            Lier une action
          </Button>
        )}
      </div>

      <SharedFicheLinkedResourcesAlert
        fiche={fiche}
        currentCollectiviteId={currentCollectivite.collectiviteId}
        sharedDataTitle="Actions associées"
        sharedDataDescription="Les actions affichées correspondent à celles de cette collectivité."
      />

      {/* Liste des fiches actions liées */}
      {!isLoading && isEmpty ? (
        <EmptyCard
          picto={(props) => <FichePicto {...props} />}
          title="Aucune action de vos plans n'est liée !"
          subTitle="Ici vous pouvez faire référence à d’autres actions de vos plans"
          isReadonly={isReadonly}
          actions={[
            {
              children: 'Lier une action',
              icon: 'link',
              onClick: () => setIsModalOpen(true),
            },
          ]}
          size="xs"
        />
      ) : (
        <FichesLieesListe
          collectivite={currentCollectivite}
          currentUserId={user.id}
          fiches={fichesLiees}
          className="sm:grid-cols-2 md:grid-cols-3"
          isLoading={isLoading}
          onUnlink={
            !isReadonly
              ? (ficheId) =>
                  updateFichesActionLiees(
                    fichesLiees.filter((f) => f.id !== ficheId).map((f) => f.id)
                  )
              : undefined
          }
        />
      )}

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
