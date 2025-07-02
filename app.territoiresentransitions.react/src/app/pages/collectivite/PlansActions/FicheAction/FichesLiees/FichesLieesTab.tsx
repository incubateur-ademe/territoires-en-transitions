import { useCollectiviteId } from '@/api/collectivites';
import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { SharedFicheLinkedResourcesAlert } from '@/app/plans/fiches/share-fiche/shared-fiche-linked-resources.alert';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Button, EmptyCard } from '@/ui';
import { useState } from 'react';
import LoadingCard from '../LoadingCard';
import {
  useFichesActionLiees,
  useUpdateFichesActionLiees,
} from '../data/useFichesActionLiees';
import FichePicto from './FichePicto';
import FichesLieesListe from './FichesLieesListe';
import ModaleFichesLiees from './ModaleFichesLiees';

type FichesLieesTabProps = {
  isReadonly: boolean;
  isFicheLoading: boolean;
  isEditLoading: boolean;
  fiche: Fiche;
};

const FichesLieesTab = ({
  isReadonly,
  isFicheLoading,
  isEditLoading,
  fiche,
}: FichesLieesTabProps) => {
  const currentCollectiviteId = useCollectiviteId();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: fichesLiees } = useFichesActionLiees(fiche.id);
  const { mutate: updateFichesActionLiees } = useUpdateFichesActionLiees(
    fiche.id
  );

  if (isFicheLoading) {
    return <LoadingCard title="Fiches action liées" />;
  }

  const isEmpty = !fichesLiees || fichesLiees.length === 0;

  return (
    <>
      <div className="bg-white border border-grey-3 rounded-lg py-7 lg:py-8 xl:py-10 px-5 lg:px-6 xl:px-8 flex flex-col gap-5">
        {/* Titre et bouton d'édition */}
        <div className="flex justify-between">
          <h5 className="text-primary-8 mb-0">Fiches action liées</h5>
          {!isReadonly && (
            <Button
              icon={!isEditLoading ? 'link' : undefined}
              size="xs"
              variant="outlined"
              disabled={isEditLoading}
              onClick={() => setIsModalOpen(true)}
            >
              {isEditLoading && <SpinnerLoader className="!h-4" />}
              Lier une fiche action
            </Button>
          )}
        </div>

        <SharedFicheLinkedResourcesAlert
          fiche={fiche}
          currentCollectiviteId={currentCollectiviteId}
          sharedDataTitle="Fiches associées"
          sharedDataDescription="Les fiches actions affichées correspondent à celles de cette collectivité."
        />

        {/* Liste des fiches actions liées */}
        {isEmpty ? (
          <EmptyCard
            picto={(props) => <FichePicto {...props} />}
            title="Aucune fiche action de vos plans d'actions n'est liée !"
            subTitle="Ici vous pouvez faire référence à d’autres fiches actions de vos plans"
            isReadonly={isReadonly}
            actions={[
              {
                children: 'Lier une fiche action',
                icon: 'link',
                onClick: () => setIsModalOpen(true),
              },
            ]}
            size="xs"
          />
        ) : (
          <FichesLieesListe
            fiches={fichesLiees}
            className="sm:grid-cols-2 md:grid-cols-3"
            onUnlink={
              !isReadonly
                ? (ficheId) =>
                    updateFichesActionLiees(
                      fichesLiees
                        .filter((f) => f.id !== ficheId)
                        .map((f) => f.id)
                    )
                : undefined
            }
          />
        )}
      </div>

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

export default FichesLieesTab;
