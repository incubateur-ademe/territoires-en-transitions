import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { useUpdateIndicateur } from '@/app/indicateurs/indicateurs/use-update-indicateur';
import { FichesList } from '@/app/plans/fiches/list-all-fiches/components/fiches-list';
import { useListFiches } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { FicheActionFiltersProvider } from '@/app/plans/fiches/list-all-fiches/filters/fiche-action-filters-context';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button, EmptyCard } from '@tet/ui';
import { useState } from 'react';
import FichePicto from '../../PlansActions/FicheAction/FichesLiees/FichePicto';
import ModaleFichesLiees from '../../PlansActions/FicheAction/FichesLiees/ModaleFichesLiees';

type Props = {
  definition: IndicateurDefinition;
};

const FichesLiees = ({
  definition,
}: Props) => {
  const { isReadOnly, collectiviteId } = useCurrentCollectivite();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { fiches } = useListFiches(collectiviteId, {
    filters: {
      indicateurIds: [definition.id],
    },
  });

  const ficheIds = fiches.map((f) => f.id);

  const { mutate: updateIndicateur } = useUpdateIndicateur(definition.id);

  const isEmpty = ficheIds.length === 0;

  return (
    <>
      {isEmpty ? (
        <EmptyCard
          picto={(props) => <FichePicto {...props} />}
          title="Aucune action de vos plans n'est liée !"
          isReadonly={isReadOnly}
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
        <div className="bg-white p-10 border border-grey-3 rounded-xl">
          <div className="flex justify-between items-center flex-wrap mb-5">
            <h6 className="text-lg mb-0">Actions liées</h6>
            {!isReadOnly && (
              <Button
                icon="link"
                size="xs"
                className="w-fit"
                onClick={() => setIsModalOpen(true)}
              >
                Lier une action
              </Button>
            )}
          </div>
          <FicheActionFiltersProvider>
            <FichesList
              filters={{
                indicateurIds: [definition.id],
                sort: 'titre',
              }}
              containerClassName="bg-white"
              onUnlink={
                isReadOnly
                  ? undefined
                  : (ficheId) =>
                      updateIndicateur({
                        ficheIds: ficheIds.filter((id) => id !== ficheId),
                      })
              }
              displayHeader={false}
            />
          </FicheActionFiltersProvider>
        </div>
      )}

      <ModaleFichesLiees
        isOpen={isModalOpen && !isReadOnly}
        setIsOpen={setIsModalOpen}
        currentFicheId={null}
        linkedFicheIds={ficheIds}
        updateLinkedFicheIds={(ficheIds) => updateIndicateur({ ficheIds })}
      />
    </>
  );
};

export default FichesLiees;
