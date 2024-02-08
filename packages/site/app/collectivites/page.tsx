'use server';

import NotFound from '@components/info/NotFound';
import {Metadata} from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Collectivités',
  };
}

const Collectivite = () => <NotFound />;

export default Collectivite;
