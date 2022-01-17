import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const TableauBord = lazy(
  () => import('app/pages/collectivite/TableauBord/TableauBord')
);

export const TableauBordPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <TableauBord />
    </Suspense>
  );
};
