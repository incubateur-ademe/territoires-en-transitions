import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const BibliothequeDocs = lazy(
  () => import('app/pages/collectivite/BibliothequeDocs/BibliothequeDocs')
);

export const BibliothequeDocsPage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <BibliothequeDocs />
    </Suspense>
  );
};
