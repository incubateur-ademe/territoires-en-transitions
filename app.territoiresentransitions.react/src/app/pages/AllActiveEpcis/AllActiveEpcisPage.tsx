import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const AllActiveEpcis = lazy(
  () => import('app/pages/AllActiveEpcis/AllActiveEpcis')
);

export const AllActiveEpcisPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <AllActiveEpcis />
    </Suspense>
  );
};
