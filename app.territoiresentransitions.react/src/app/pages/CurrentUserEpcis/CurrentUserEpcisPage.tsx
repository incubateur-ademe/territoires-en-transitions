import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const CurrentUserEpcis = lazy(
  () => import('app/pages/CurrentUserEpcis/CurrentUserEpcis')
);

export const CurrentUserEpcisPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <CurrentUserEpcis />
    </Suspense>
  );
};
