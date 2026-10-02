import 'server-only';

import { fetchSingle } from '@/site/src/strapi/strapi';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';

/** Référencement de la page, saisi dans Strapi (type « 7. Démarche PCAET »). */
export const getDemarchePcaetSeo = async () => {
  const data = await fetchSingle('page-demarche-pcaet', [
    ['populate[0]', 'seo'],
    ['populate[1]', 'seo.metaImage'],
  ]);
  const seo = data?.attributes.seo;
  const image = (seo?.metaImage?.data as unknown as StrapiItem | undefined)
    ?.attributes;

  return {
    title: (seo?.metaTitle as unknown as string) ?? undefined,
    description: (seo?.metaDescription as unknown as string) ?? undefined,
    image: image
      ? {
          url: image.url as unknown as string,
          width: image.width as unknown as number,
          height: image.height as unknown as number,
          type: image.mime as unknown as string,
          alt: image.alternativeText as unknown as string,
        }
      : undefined,
  };
};
