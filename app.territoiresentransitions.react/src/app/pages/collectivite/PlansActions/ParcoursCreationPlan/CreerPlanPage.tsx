import { useCollectiviteId } from '@/api/collectivites/collectivite-context';
import { useCreatePlanAction } from '@/app/plans/plans/show-detailed-plan/data/use-upsert-axe';
import { UpsertPlanForm } from '@/app/plans/plans/upsert-plan/upsert-plan.form';
import { renderLoader } from '@/app/utils/renderLoader';
import { Icon } from '@/ui';
import { Suspense } from 'react';
import { useHistory } from 'react-router-dom';

const CreerPlanPageView = () => {
  const history = useHistory();
  const collectiviteId = useCollectiviteId();
  const goBackToPreviousPage = () => {
    history.goBack();
  };
  const { mutate: createPlanAction } = useCreatePlanAction();

  return (
    <Suspense fallback={renderLoader()}>
      <div className="max-w-3xl mx-auto flex flex-col grow py-12">
        <div className="w-full mx-auto">
          <h3 className="mb-8">
            <Icon icon="edit-box-fill" size="lg" className="mr-2" />
            Créer un plan d’action
          </h3>
          <UpsertPlanForm
            goBackToPreviousPage={goBackToPreviousPage}
            onSubmit={(data) => {
              createPlanAction({
                collectivite_id: collectiviteId,
                nom: data.nom,
                type: data.type?.id ?? null,
              });
            }}
          />
        </div>
      </div>
    </Suspense>
  );
};

export const CreerPlanPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <CreerPlanPageView />
    </Suspense>
  );
};
