'use client';

import {usePathname} from 'next/navigation';
import {TrackUnplannedPageView} from '@tet/ui';

const TrackPage = () => {
  const pathName = usePathname();

  return (
    <TrackUnplannedPageView
      pageName={`site${pathName === '/' ? '/accueil' : pathName}`}
    />
  );
};

export default TrackPage;
