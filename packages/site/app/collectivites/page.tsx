'use server';

import { Metadata } from 'next';
import Carte from './Carte';
import Section from '@tet/site/components/sections/Section';
import CollectiviteSearchConnected from './CollectiviteSearch';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Collectivités',
  };
}

const Collectivite = () => (
  <>
    <Carte />
    <Section
      containerClassName="bg-primary-7 max-md:!py-6 md:max-lg:!py-12 lg:!py-20"
      className="md:gap-9"
    >
      <h2 className="text-white text-center mb-0">
        Je ne trouve pas ma collectivité sur la carte !
      </h2>
      <CollectiviteSearchConnected />
    </Section>
  </>
);

export default Collectivite;
