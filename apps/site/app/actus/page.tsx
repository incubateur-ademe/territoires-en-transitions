'use server';

import Section from '@/site/components/sections/Section';
import { fetchCollection } from '@/site/src/strapi/strapi';
import { Divider } from '@tet/ui';
import { Metadata } from 'next';
import ListeActus from './ListeActus';
import { ActualiteCategorie } from './utils';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Actualités',
  };
}

const getCategories = async () => {
  const { data } = await fetchCollection<ActualiteCategorie>(
    'actualites-categories'
  );
  return (data ?? [])
    .filter((d) => !!d.nom)
    .map((d) => ({
      value: d.documentId,
      label: d.nom as string,
    }));
};

const Actualites = async () => {
  const categories = await getCategories();

  return (
    <Section>
      <h1 id="actus-header" className="text-center mb-4">
        Actualités
      </h1>
      <Divider className="pb-3" />
      <ListeActus categories={categories} />
    </Section>
  );
};

export default Actualites;
