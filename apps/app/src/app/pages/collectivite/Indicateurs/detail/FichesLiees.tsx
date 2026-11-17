import { appLabels } from '@/app/labels/catalog';
import { FichesListTable } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.table/fiches-list.table';
import { useIndicateurFichesLiees } from './indicateur-fiches-liees.context';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button, EmptyCard } from '@tet/ui';
import { useState } from 'react';
import { FichePicto } from './fiche.picto';
import { FichesLieesModal } from './fiches-liees.modal';
import { useIndicateurData } from './indicateur-data.context';
import { useIndicateurActions } from './indicateur-actions.context';

const FichesLiees = () => {
  const collectivite = useCurrentCollectivite();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { indicateur, canMutateIndicateur } = useIndicateurData();
  const { useListFichesLiees } = useIndicateurFichesLiees();
  const fiches = useListFichesLiees(indicateur.id);

  const ficheIds = fiches.map((f) => f.id);

  const { updateIndicateur } = useIndicateurActions();

  const isEmpty = ficheIds.length === 0;

  return (
    <>
      {isEmpty ? (
        <EmptyCard
          picto={(props) => <FichePicto {...props} />}
          title={appLabels.aucuneActionLiee}
          isReadonly={!canMutateIndicateur}
          actions={[
            {
              children: appLabels.lierAction,
              icon: 'link',
              onClick: () => setIsModalOpen(true),
            },
          ]}
          size="xs"
        />
      ) : (
        <div className="bg-white p-10 border border-grey-3 rounded-xl">
          <div className="flex justify-between items-center flex-wrap mb-5">
            <h6 className="text-lg mb-0">{appLabels.actionsLiees}</h6>
            {canMutateIndicateur && (
              <Button
                icon="link"
                size="xs"
                className="w-fit"
                onClick={() => setIsModalOpen(true)}
              >
                {appLabels.lierAction}
              </Button>
            )}
          </div>
          <FichesListTable
            collectivite={collectivite}
            fiches={fiches}
            isLoading={false}
            isGroupedActionsOn={false}
            enableSelection={false}
            onUnlink={
              canMutateIndicateur
                ? (ficheId) =>
                    updateIndicateur({
                      ficheIds: ficheIds.filter((id) => id !== ficheId),
                    })
                : undefined
            }
          />
        </div>
      )}

      <FichesLieesModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        currentFicheId={null}
        linkedFicheIds={ficheIds}
        updateLinkedFicheIds={(ficheIds) => updateIndicateur({ ficheIds })}
      />
    </>
  );
};

export default FichesLiees;
