import { useCreateFicheAction } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheAction';
import { useCreatePlan } from '@/app/plans/plans/show-plan/data/use-create-plan';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { EmptyCard } from '@tet/ui';
import { EmptyFichePicto } from './empty-fiche.picto';

export const FichesListEmpty = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) => {
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const { mutate: createFicheAction } = useCreateFicheAction();
  const { mutate: createPlan } = useCreatePlan({ collectiviteId });

  return (
    <div className="col-span-full flex flex-col items-center p-12 text-center bg-primary-0 border border-primary-4 rounded-xl">
      <EmptyCard
        picto={(props) => <EmptyFichePicto {...props} />}
        title="Vous n'avez pas encore créé d'actions !"
        subTitle="Une fois vos actions créées, vous les retrouvez toutes dans cette vue où vous pourrez les filtrer sur de nombreux critères."
        actions={[
          {
            children: 'Créer un plan',
            onClick: () =>
              createPlan({
                collectiviteId,
                nom: 'Sans titre',
              }),
            variant: 'outlined',
            isVisible: hasCollectivitePermission('plans.mutate'),
          },
          {
            children: 'Créer une action',
            onClick: () => createFicheAction(),
            isVisible: hasCollectivitePermission('plans.fiches.create'),
          },
        ]}
        variant="transparent"
      />
    </div>
  );
};
