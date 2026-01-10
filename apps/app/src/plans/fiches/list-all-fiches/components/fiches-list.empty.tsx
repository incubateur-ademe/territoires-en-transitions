import { useCreateFicheAction } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheAction';
import { useCreatePlan } from '@/app/plans/plans/show-plan/data/use-create-plan';
import { EmptyCard } from '@tet/ui';
import { EmptyFichePicto } from './empty-fiche.picto';

export const FichesListEmpty = ({
  isReadOnly,
  collectiviteId,
}: {
  isReadOnly: boolean;
  collectiviteId: number;
}) => {
  const { mutate: createFicheAction } = useCreateFicheAction();
  const { mutate: createPlan } = useCreatePlan({ collectiviteId });

  return (
    <div className="col-span-full flex flex-col items-center p-12 text-center bg-primary-0 border border-primary-4 rounded-xl">
      <EmptyCard
        picto={(props) => <EmptyFichePicto {...props} />}
        title="Vous n'avez pas encore créé d'actions !"
        subTitle="Une fois vos actions créées, vous les retrouvez toutes dans cette vue où vous pourrez les filtrer sur de nombreux critères."
        isReadonly={isReadOnly}
        actions={[
          {
            children: 'Créer un plan',
            onClick: () =>
              createPlan({
                collectiviteId,
                nom: 'Sans titre',
              }),
            variant: 'outlined',
          },
          {
            children: 'Créer une action',
            onClick: () => createFicheAction(),
          },
        ]}
        variant="transparent"
      />
    </div>
  );
};
