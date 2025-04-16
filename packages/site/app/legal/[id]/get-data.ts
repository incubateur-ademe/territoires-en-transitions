import { fetchCollection } from '@/site/src/strapi/strapi';

export const getLegalData = async (slug: string) => {
  const { data } = await fetchCollection('legals', [['filters[slug]', slug]]);

  if (!data || data.length === 0) return null;

  const legalData = data[0].attributes;

  return {
    id: legalData.slug as string,
    titre: legalData.titre as string,
    contenu: legalData.contenu as string,
    updatedAt: legalData.updatedAt as string,
    createdAt: legalData.createdAt as string,
  };
};
