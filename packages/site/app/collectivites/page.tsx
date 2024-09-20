'use server';

import {Metadata} from 'next';
import Carte from './Carte';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Collectivités',
  };
}

const Collectivite = () => <Carte />;

export default Collectivite;
