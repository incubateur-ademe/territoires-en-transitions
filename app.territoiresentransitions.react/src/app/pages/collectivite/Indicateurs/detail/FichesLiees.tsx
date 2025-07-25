import { useListFicheResumes } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-list-fiche-resumes';
import { Button, EmptyCard } from '@/ui';
import { useState } from 'react';
import FichePicto from '../../PlansActions/FicheAction/FichesLiees/FichePicto';
import ModaleFichesLiees from '../../PlansActions/FicheAction/FichesLiees/ModaleFichesLiees';
import FichesActionListe from '../../PlansActions/ToutesLesFichesAction/FichesActionListe';
import { useUpdateFichesActionLiees } from '../Indicateur/useFichesActionLiees';
import { TIndicateurDefinition } from '../types';

type Props = {
  definition: TIndicateurDefinition;
  isReadonly: boolean;
};

const FichesLiees = ({ definition, isReadonly }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // const { data: fiches } = useFichesActionLiees(definition);
  const { data: fiches } = useListFicheResumes({
    filters: {
      indicateurIds: [definition.id],
    },
  });

  const ficheIds = (fiches?.data ?? []).map((f) => f.id);

  const { mutate: updateFichesActionLiees } =
    useUpdateFichesActionLiees(definition);

  const isEmpty = ficheIds.length === 0;

  return (
    <>
      {isEmpty ? (
        <EmptyCard
          picto={(props) => <FichePicto {...props} />}
          title="Aucune fiche action de vos plans d'actions n'est liée !"
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
        <div className="bg-white p-10 border border-grey-3 rounded-xl">
          <div className="flex justify-between items-center flex-wrap mb-5">
            <h6 className="text-lg mb-0">Fiches action liées</h6>
            {!isReadonly && (
              <Button
                icon="link"
                size="xs"
                className="w-fit"
                onClick={() => setIsModalOpen(true)}
              >
                Lier une fiche action
              </Button>
            )}
          </div>
          <FichesActionListe
            filtres={{ ficheIds: ficheIds }}
            sortSettings={{
              defaultSort: 'titre',
            }}
            isReadOnly={isReadonly}
            enableGroupedActions
            containerClassName="bg-white"
            onUnlink={(ficheId) =>
              updateFichesActionLiees(ficheIds.filter((id) => id !== ficheId))
            }
          />
        </div>
      )}

      {isModalOpen && (
        <ModaleFichesLiees
          isOpen={isModalOpen && !isReadonly}
          setIsOpen={setIsModalOpen}
          currentFicheId={null}
          linkedFicheIds={ficheIds}
          updateLinkedFicheIds={updateFichesActionLiees}
        />
      )}
    </>
  );
};

export default FichesLiees;
