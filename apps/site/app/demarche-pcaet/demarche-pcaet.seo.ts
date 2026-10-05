import { toOpenGraphImage } from '@/site/src/strapi/media';
import 'server-only';

import { fetchSingle } from '@/site/src/strapi/strapi';
import { Seo } from '@/site/src/strapi/types';

/** Single type `page-demarche-pcaet` */
export type PageDemarchePcaet = {
  seo?: Seo | null;
};

/** Référencement de la page, saisi dans Strapi (type « 7. Démarche PCAET »). */
export const getDemarchePcaetSeo = async () => {
  const data = await fetchSingle<PageDemarchePcaet>('page-demarche-pcaet', [
    ['populate[seo][populate]', 'metaImage'],
  ]);
  const seo = data?.seo;
  const image = seo?.metaImage;

  return {
    title: seo?.metaTitle ?? undefined,
    description: seo?.metaDescription ?? undefined,
    image: toOpenGraphImage(image),
  };
};
