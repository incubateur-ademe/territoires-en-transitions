import {Suspense} from 'react';
import {lazy} from 'utils/lazy';
import {renderLoader} from 'utils/renderLoader';

const TableauDeBord = lazy(
  () => import('app/pages/collectivite/TableauDeBord/TableauDeBord')
);

export const TableauDeBordPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <TableauDeBord />
    </Suspense>
  );
};
