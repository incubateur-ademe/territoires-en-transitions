import {lazy, Suspense} from 'react';
import {renderLoader} from 'utils/renderLoader';

const JournalActivite = lazy(
  () => import('app/pages/collectivite/Historique/JournalActivite')
);

export const JournalActivitePage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <JournalActivite />
    </Suspense>
  );
};
