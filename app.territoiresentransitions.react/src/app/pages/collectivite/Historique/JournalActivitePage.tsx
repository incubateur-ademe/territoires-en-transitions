import { Suspense } from 'react';
import { lazy } from 'utils/lazy';
import { renderLoader } from 'utils/renderLoader';

const JournalActivite = lazy(
  () => import('@/app/app/pages/collectivite/Historique/JournalActivite')
);

export const JournalActivitePage = () => {
  return (
    <Suspense fallback={renderLoader()}>
      <JournalActivite />
    </Suspense>
  );
};
