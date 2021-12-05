import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const ElsesEpcis = lazy(() => import('app/pages/ElsesEpcis/ElsesEpcis'));

export const ElsesEpcisPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <ElsesEpcis />
    </Suspense>
  );
};
