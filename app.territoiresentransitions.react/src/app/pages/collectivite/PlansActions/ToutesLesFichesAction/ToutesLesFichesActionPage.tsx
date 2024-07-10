import {Suspense} from 'react';
import {lazy} from 'utils/lazy';
import {renderLoader} from 'utils/renderLoader';

const ToutesLesFichesAction = lazy(
  () =>
    import(
      'app/pages/collectivite/PlansActions/ToutesLesFichesAction/ToutesLesFichesAction'
    )
);

export const ToutesLesFichesActionPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <ToutesLesFichesAction />
    </Suspense>
  );
};
