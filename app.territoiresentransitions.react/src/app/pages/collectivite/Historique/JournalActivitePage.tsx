import { lazy } from '@/app/utils/lazy';
import { renderLoader } from '@/app/utils/renderLoader';
import { Suspense } from 'react';

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
