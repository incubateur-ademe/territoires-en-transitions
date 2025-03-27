import { StrapiItem } from '@/site/src/strapi/StrapiItem';
import { fetchCollection } from '@/site/src/strapi/strapi';

export type ActuCard = {
  id: number;
  titre: string;
  dateCreation: Date;
  epingle: boolean;
  categories: string[];
  resume?: string;
  couverture: StrapiItem;
};

export const getData = async ({
  page,
  limit,
  categories = [],
}: {
  page: number;
  limit: number;
  categories?: number[];
}) => {
  const filterCondition: [string, string][] | null =
    categories && categories.length > 0
      ? categories.map((c, idx) => [
          `filters[$or][${idx}][categories][id]`,
          `${c}`,
        ])
      : null;

  const fetchOptions: [string, string][] = [
    ['populate[0]', 'Couverture'],
    ['populate[1]', 'categories'],
  ];

  if (filterCondition) fetchOptions.push(...filterCondition);

  fetchOptions.push(
    ['sort[0]', 'Epingle:desc'],
    ['sort[1]', 'createdAt:desc'],
    ['pagination[start]', `${(page - 1) * limit}`],
    ['pagination[limit]', `${limit}`]
  );

  const actus = await fetchCollection('actualites', fetchOptions);

  const formattedData: ActuCard[] | null = actus.data
    ? actus.data.map((d) => ({
        id: d.id,
        titre: d.attributes.Titre as unknown as string,
        dateCreation:
          (d.attributes.DateCreation as unknown as Date) ??
          (d.attributes.createdAt as unknown as Date),
        epingle: (d.attributes.Epingle as unknown as boolean) ?? false,
        categories: (
          (d.attributes.categories?.data as unknown as StrapiItem[]) ?? []
        ).map((d) => d.attributes.nom as unknown as string),
        resume: (d.attributes.Resume as unknown as string) ?? undefined,
        couverture: d.attributes.Couverture.data as unknown as StrapiItem,
      }))
    : [];

  return {
    data: formattedData.sort((a, b) => {
      if (a.epingle && !b.epingle) return -1;
      if (!a.epingle && b.epingle) return 1;

      return (
        new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
      );
    }),
    pagination: actus.meta.pagination,
  };
};
