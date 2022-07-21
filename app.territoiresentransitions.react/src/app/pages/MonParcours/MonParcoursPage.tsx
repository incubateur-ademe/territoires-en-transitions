import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const MonParcours = lazy(() => import('./MonParcours'));

export const MonParcoursPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <MonParcours />
    </Suspense>
  );
};
