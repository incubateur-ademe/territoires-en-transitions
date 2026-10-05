import { toOpenGraphImage } from '@/site/src/strapi/media';
import { fetchSingle } from '@/site/src/strapi/strapi';
import {
  Seo,
  StrapiEntry,
  StrapiMedia,
  Temoignage,
} from '@/site/src/strapi/types';

/**
 * Champs du single type `page-outils-numerique` lus par le site. Les autres
 * (panier, trajectoire, équipe, questions…) existent dans Strapi mais la page
 * les porte dans le code.
 */
type PageOutilsNumerique = {
  seo?: Seo | null;
  accroche: string;
  couverture?: StrapiMedia | null;
  temoignages_liste?: StrapiEntry<{ temoignage: Temoignage }>[];
};

export const getStrapiData = async () => {
  const data = await fetchSingle<PageOutilsNumerique>('page-outils-numerique', [
    ['fields[0]', 'accroche'],
    ['populate[seo][populate]', 'metaImage'],
    ['populate[couverture]', 'true'],
    ['populate[temoignages_liste][populate][temoignage][populate]', 'portrait'],
  ]);

  if (!data) return null;

  return {
    seo: {
      metaTitle: data.seo?.metaTitle ?? undefined,
      metaDescription: data.seo?.metaDescription ?? data.accroche,
      metaImage: toOpenGraphImage(data.seo?.metaImage ?? data.couverture),
    },
    temoignages: (data.temoignages_liste ?? []).map((t) => ({
      id: t.id,
      auteur: t.temoignage.auteur,
      role: t.temoignage.role,
      temoignage: t.temoignage.temoignage,
      portrait: t.temoignage.portrait ?? undefined,
    })),
  };
};
