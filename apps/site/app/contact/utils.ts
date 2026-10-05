import { fetchSingle } from '@/site/src/strapi/strapi';
import { Seo, StrapiMedia } from '@/site/src/strapi/types';

/** Single type `page-contact` */
export type PageContact = {
  seo?: Seo | null;
  titre: string;
  description: string | null;
  couverture: StrapiMedia | null;
  telephone: string;
  horaires: string;
  legende_visible: boolean | null;
};

export const getStrapiData = async () => {
  const data = await fetchSingle<PageContact>('page-contact', [
    ['populate[seo][populate]', 'metaImage'],
    ['populate[couverture]', 'true'],
  ]);

  if (!data) return null;

  const metaImage = data.seo?.metaImage ?? data.couverture;

  return {
    seo: {
      metaTitle: data.seo?.metaTitle ?? undefined,
      metaDescription:
        data.seo?.metaDescription ?? data.description ?? undefined,
      metaImage: metaImage
        ? {
            url: metaImage.url,
            width: metaImage.width ?? 0,
            height: metaImage.height ?? 0,
            type: metaImage.mime,
            alt: metaImage.alternativeText ?? '',
          }
        : undefined,
    },
    titre: data.titre,
    description: data.description ?? undefined,
    telephone: data.telephone,
    horaires: data.horaires,
    couverture: data.couverture ?? undefined,
    legendeVisible: data.legende_visible ?? false,
  };
};
