import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

const BibliothequeDocs = lazy(
  () => import('@/app/app/pages/collectivite/BibliothequeDocs/BibliothequeDocs')
);

export const BibliothequeDocsPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <BibliothequeDocs />
    </Suspense>
  );
};
