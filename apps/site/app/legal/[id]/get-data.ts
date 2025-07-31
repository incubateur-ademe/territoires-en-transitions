import { fetchCollection } from '@/site/src/strapi/strapi';

export const getLegalData = async (slug: string) => {
  const { data } = await fetchCollection('legals', [['filters[slug]', slug]]);

  if (!data || data.length === 0) return null;

  const legalData = data[0].attributes;

  return {
    id: legalData.slug as unknown as string,
    titre: legalData.titre as unknown as string,
    contenu: legalData.contenu as unknown as string,
    updatedAt: legalData.updatedAt as unknown as string,
    createdAt: legalData.createdAt as unknown as string,
  };
};
