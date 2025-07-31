'use server';

import { getCollectivitesALaUne } from '@/site/app/collectivites/utils';
import { Metadata } from 'next';
import CollectivitesPage from './collectivites.page';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Collectivités',
  };
}

const Collectivite = async () => {
  const { data: collectivitesStrapi } = await getCollectivitesALaUne();

  return <CollectivitesPage collectivitesStrapi={collectivitesStrapi} />;
};

export default Collectivite;
