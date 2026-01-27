import { useCreateFicheAction } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheAction';
import { EmptyCard } from '@tet/ui';
import { EmptyFichePicto } from './empty-fiche.picto';

export const FichesListEmpty = ({ isReadOnly }: { isReadOnly: boolean }) => {
  const { mutate: createFicheAction } = useCreateFicheAction();

  return (
    <div className="col-span-full flex flex-col items-center p-12 text-center bg-primary-0 border border-primary-4 rounded-xl">
      <EmptyCard
        picto={(props) => <EmptyFichePicto {...props} />}
        title="Vous n'avez pas encore créé d'actions !"
        subTitle="Une fois vos actions créées, vous les retrouvez toutes dans cette vue où vous pourrez les filtrer sur de nombreux critères."
        isReadonly={isReadOnly}
        actions={[
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
