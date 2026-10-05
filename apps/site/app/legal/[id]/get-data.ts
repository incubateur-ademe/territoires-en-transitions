import { fetchCollection } from '@/site/src/strapi/strapi';

/** Collection `legal` */
export type Legal = {
  titre: string;
  slug: string;
  contenu: string | null;
};

export const getLegalData = async (slug: string) => {
  const { data } = await fetchCollection<Legal>('legals', [
    ['filters[slug]', slug],
  ]);

  const legal = data?.[0];
  if (!legal) return null;

  return {
    id: legal.slug,
    titre: legal.titre,
    contenu: legal.contenu ?? '',
    updatedAt: legal.updatedAt,
    createdAt: legal.createdAt,
  };
};
