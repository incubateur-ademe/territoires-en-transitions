'use client';

import React, {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import TrackPageView from '@components/TrackPageView/index';

/**
 * Panier d'actions à impact
 *
 * Pour créer un nouveau panier sans lien avec aucune collectivité :
 * /landing
 *
 * Pour créer un nouveau panier pour une collectivité, ou revenir sur
 * le panier récent créé pour cette collectivité :
 * /landing/collectivite/[collectivite_id]
 *
 * Pour revenir sur un panier existant :
 * /panier/[panier_id]
 */

const Page = () => {
  const router = useRouter();

  useEffect(() => {
    router.push('/landing');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <TrackPageView pageName="panier/" />;
};

export default Page;
