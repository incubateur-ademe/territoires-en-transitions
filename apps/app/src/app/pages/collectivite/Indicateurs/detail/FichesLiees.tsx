import { IndicateurDefinition } from '@/app/indicateurs/definitions/use-get-indicateur-definition';
import { useUpdateIndicateurDefinition } from '@/app/indicateurs/definitions/use-update-indicateur-definition';
import { FichesList } from '@/app/plans/fiches/list-all-fiches/components/fiches-list';
import { useListFiches } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { FicheActionFiltersProvider } from '@/app/plans/fiches/list-all-fiches/filters/fiche-action-filters-context';
import { Button, EmptyCard } from '@/ui';
import { useState } from 'react';
import FichePicto from '../../PlansActions/FicheAction/FichesLiees/FichePicto';
import ModaleFichesLiees from '../../PlansActions/FicheAction/FichesLiees/ModaleFichesLiees';
import { PermissionOperation } from '@/domain/users';

type Props = {
  definition: IndicateurDefinition;
  isReadonly: boolean;
  permissions: PermissionOperation[];
  collectiviteId: number;
};

const FichesLiees = ({
  definition,
  isReadonly,
  permissions,
  collectiviteId,
}: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { fiches } = useListFiches(collectiviteId, {
    filters: {
      indicateurIds: [definition.id],
    },
  });

  const ficheIds = fiches.map((f) => f.id);

  const { mutate: updateIndicateur } = useUpdateIndicateurDefinition(
    definition.id
  );

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
          <FicheActionFiltersProvider>
            <FichesList
              filters={{
                indicateurIds: [definition.id],
                sort: 'titre',
              }}
              permissions={permissions}
              isReadOnly={isReadonly}
              containerClassName="bg-white"
              onUnlink={(ficheId) =>
                updateIndicateur({
                  ficheIds: ficheIds.filter((id) => id !== ficheId),
                })
              }
            />
          </FicheActionFiltersProvider>
        </div>
      )}

      {isModalOpen && (
        <ModaleFichesLiees
          isOpen={isModalOpen && !isReadonly}
          setIsOpen={setIsModalOpen}
          currentFicheId={null}
          linkedFicheIds={ficheIds}
          updateLinkedFicheIds={(ficheIds) => updateIndicateur({ ficheIds })}
        />
      )}
    </>
  );
};

export default FichesLiees;
