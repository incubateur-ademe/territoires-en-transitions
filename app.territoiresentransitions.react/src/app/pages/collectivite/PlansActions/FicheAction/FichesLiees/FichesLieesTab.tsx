import { FicheAction } from '@tet/api/plan-actions';
import { Button } from '@tet/ui';
import { useState } from 'react';
import SpinnerLoader from 'ui/shared/SpinnerLoader';
import EmptyCard from '../EmptyCard';
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
  fiche: FicheAction;
};

const FichesLieesTab = ({
  isReadonly,
  isFicheLoading,
  isEditLoading,
  fiche,
}: FichesLieesTabProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: fichesLiees } = useFichesActionLiees(fiche.id);
  const { mutate: updateFichesActionLiees } = useUpdateFichesActionLiees(
    fiche.id
  );

  if (isFicheLoading) {
    return <LoadingCard title="Fiches des plans liées" />;
  }

  const isEmpty = !fichesLiees || fichesLiees.length === 0;

  return (
    <>
      {isEmpty ? (
        <EmptyCard
          picto={(className) => <FichePicto className={className} />}
          title="Aucune fiche action de vos plans d'actions n'est liée !"
          subTitle="Ici vous pouvez faire référence à d’autres fiches actions de vos plans"
          isReadonly={isReadonly}
          action={{
            label: 'Lier une fiche action',
            icon: 'link',
            onClick: () => setIsModalOpen(true),
          }}
        />
      ) : (
        <div className="bg-white border border-grey-3 rounded-lg py-7 lg:py-8 xl:py-10 px-5 lg:px-6 xl:px-8 flex flex-col gap-5">
          {/* Titre et bouton d'édition */}
          <div className="flex justify-between">
            <h5 className="text-primary-8 mb-0">Fiches des plans liées</h5>
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

          {/* Liste des fiches des plans liées */}
          <FichesLieesListe
            fiches={fichesLiees}
            className="sm:grid-cols-2 md:grid-cols-3"
            onUnlink={(ficheId) =>
              updateFichesActionLiees(
                fichesLiees.filter((f) => f.id !== ficheId).map((f) => f.id)
              )
            }
          />
        </div>
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

export default FichesLieesTab;
