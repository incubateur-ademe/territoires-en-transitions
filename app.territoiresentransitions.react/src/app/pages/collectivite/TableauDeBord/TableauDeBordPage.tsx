import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

const TableauDeBord = lazy(
  () => import('@/app/app/pages/collectivite/TableauDeBord/TableauDeBord')
);

export const TableauDeBordPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <TableauDeBord />
    </Suspense>
  );
};
