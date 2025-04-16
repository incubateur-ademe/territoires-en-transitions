import { StrapiItem } from '@/site/src/strapi/StrapiItem';

export type Content = {
  id: number;
  titre?: string;
  description: string;
  image?: StrapiItem;
  href?: string;
};
