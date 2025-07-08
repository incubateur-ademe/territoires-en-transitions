import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';
import { useHistory } from 'react-router-dom';

const PlanImportView = lazy(() =>
  import(
    '@/app/app/pages/collectivite/PlansActions/ParcoursCreationPlan/plan-import.view'
  ).then((module) => ({ default: module.PlanImportView }))
);

export const ImporterPlanPage = () => {
  const history = useHistory();
  const goBackToPreviousPage = () => {
    history.goBack();
  };
  return (
    <Suspense fallback={renderLoader()}>
      <PlanImportView goBackToPreviousPage={goBackToPreviousPage} />
    </Suspense>
  );
};
