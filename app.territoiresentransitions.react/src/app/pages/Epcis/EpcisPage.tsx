import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const Epcis = lazy(() => import('./Epcis'));

export const EpcisPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <Epcis />
    </Suspense>
  );
};
