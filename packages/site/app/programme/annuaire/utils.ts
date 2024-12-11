import { StrapiItem } from '@/site/src/strapi/StrapiItem';
import { fetchCollection } from '@/site/src/strapi/strapi';

export type ConseillerType = {
  id: number;
  prenom: string;
  nom: string;
  structure: string;
  region: string;
  ville: string;
  email: string;
  linkedin: string;
  site: string;
  photo: StrapiItem;
};

export const getData = async ({
  page,
  limit,
  search = '',
}: {
  page: number;
  limit: number;
  search?: string;
}) => {
  const conseillers = await fetchCollection('conseillers', [
    ['populate[0]', 'photo'],
    ['filters[$or][0][prenom][$startsWithi]', search],
    ['filters[$or][1][nom][$startsWithi]', search],
    ['filters[$or][2][structure][$startsWithi]', search],
    ['filters[$or][3][region][$startsWithi]', search],
    ['sort[0]', 'nom:asc'],
    ['pagination[start]', `${(page - 1) * limit}`],
    ['pagination[limit]', `${limit}`],
  ]);

  return {
    data: !conseillers.data
      ? []
      : (conseillers.data.map((d) => ({
          id: d.id,
          prenom: d.attributes.prenom as unknown as string,
          nom: d.attributes.nom as unknown as string,
          structure: d.attributes.structure as unknown as string,
          region: d.attributes.region as unknown as string,
          ville: d.attributes.ville as unknown as string,
          email: d.attributes.email as unknown as string,
          linkedin: d.attributes.linkedin as unknown as string,
          site: d.attributes.site as unknown as string,
          photo:
            (d.attributes.photo.data as unknown as StrapiItem) ?? undefined,
        })) as ConseillerType[]),
    pagination: conseillers.meta.pagination,
  };
};
