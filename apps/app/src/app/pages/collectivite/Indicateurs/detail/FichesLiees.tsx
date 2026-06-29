import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { useUpdateIndicateur } from '@/app/indicateurs/indicateurs/use-update-indicateur';
import { appLabels } from '@/app/labels/catalog';
import { FichesListTable } from '@/app/plans/fiches/list-all-fiches/components/fiches-list.table/fiches-list.table';
import { useListFiches } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button, EmptyCard } from '@tet/ui';
import { useState } from 'react';
import { FichePicto } from './fiche.picto';
import { FichesLieesModal } from './fiches-liees.modal';

type Props = {
  definition: IndicateurDefinition;
};

const FichesLiees = ({ definition }: Props) => {
  const collectivite = useCurrentCollectivite();
  const { hasCollectivitePermission, collectiviteId } = collectivite;
  useCurrentCollectivite();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { fiches } = useListFiches(collectiviteId, {
    filters: {
      indicateurIds: [definition.id],
    },
  });

  const ficheIds = fiches.map((f) => f.id);

  const { mutate: updateIndicateur } = useUpdateIndicateur(definition.id);

  const isEmpty = ficheIds.length === 0;

  const canUpdateIndicateur = hasCollectivitePermission(
    'indicateurs.indicateurs.update'
  );

  return (
    <>
      {isEmpty ? (
        <EmptyCard
          picto={(props) => <FichePicto {...props} />}
          title={appLabels.aucuneActionLiee}
          isReadonly={!canUpdateIndicateur}
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
            {canUpdateIndicateur && (
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
              canUpdateIndicateur
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
