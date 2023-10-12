'use server';

import {Metadata} from 'next';
import {notFound} from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Collectivités',
  };
}

const Collectivite = () => {
  notFound();
};

export default Collectivite;
