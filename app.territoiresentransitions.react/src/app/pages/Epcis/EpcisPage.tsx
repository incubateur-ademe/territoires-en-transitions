import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const Epcis = lazy(() => import('app/pages/Epcis/Epcis'));

export const EpcisPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <Epcis />
    </Suspense>
  );
};
