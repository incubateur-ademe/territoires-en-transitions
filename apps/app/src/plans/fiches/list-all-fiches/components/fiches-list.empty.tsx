import { useCreateFicheAction } from '@/app/plans/fiches/data/use-create-fiche-action';
import { appLabels } from '@/app/labels/catalog';
import { PermissionOperation } from '@tet/domain/users';
import { EmptyCard } from '@tet/ui';
import { EmptyFichePicto } from './empty-fiche.picto';

export const FichesListEmpty = ({
  hasCollectivitePermission,
}: {
  hasCollectivitePermission: (permission: PermissionOperation) => boolean;
}) => {
  const { mutate: createFicheAction } = useCreateFicheAction();

  return (
    <div className="col-span-full flex flex-col items-center p-12 text-center bg-primary-0 border border-primary-4 rounded-xl">
      <EmptyCard
        picto={(props) => <EmptyFichePicto {...props} />}
        title={appLabels.aucuneActionCreee}
        subTitle={appLabels.aucuneActionCreeeDescription}
        actions={[
          {
            children: appLabels.creerAction,
            onClick: () => createFicheAction(),
            isVisible: hasCollectivitePermission('plans.fiches.create'),
          },
        ]}
        variant="transparent"
      />
    </div>
  );
};
