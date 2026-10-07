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
  const categories = (data ?? []).filter((d) => !!d.nom);
  return {
    options: categories.map((d) => ({
      value: d.documentId,
      label: d.nom as string,
    })),
    // id numérique → documentId de chaque catégorie : sert à valider les
    // valeurs d'URL et à traduire les liens d'avant Strapi 5 (?c=31).
    legacyIds: Object.fromEntries(
      categories.map((d) => [String(d.id), d.documentId])
    ),
  };
};

const Actualites = async () => {
  const { options, legacyIds } = await getCategories();

  return (
    <Section>
      <h1 id="actus-header" className="text-center mb-4">
        Actualités
      </h1>
      <Divider className="pb-3" />
      <ListeActus categories={options} legacyCategoryIds={legacyIds} />
    </Section>
  );
};

export default Actualites;
