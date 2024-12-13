import { Suspense } from 'react';
import { lazy } from 'utils/lazy';
import { renderLoader } from 'utils/renderLoader';

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
