'use server';

// Server Action : STRAPI_KEY n'existe que côté serveur, un appel direct
// depuis le navigateur partait sans clé (401) et la liste restait vide.
import { fetchCollection } from '@/site/src/strapi/strapi';
import { ActuCard, Actualite, getCategoriesNoms } from './utils';

export const getData = async ({
  page,
  limit,
  categories = [],
}: {
  page: number;
  limit: number;
  categories?: string[];
}) => {
  const filterCondition: [string, string][] | null =
    categories && categories.length > 0
      ? categories.map((documentId, idx) => [
          `filters[$or][${idx}][categories][documentId]`,
          documentId,
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

  const actus = await fetchCollection<Actualite>('actualites', fetchOptions);

  const formattedData: ActuCard[] = (actus.data ?? []).map((d) => ({
    documentId: d.documentId,
    titre: d.Titre,
    dateCreation: new Date(d.DateCreation ?? d.createdAt),
    epingle: d.Epingle ?? false,
    categories: getCategoriesNoms(d.categories),
    resume: d.Resume ?? undefined,
    couverture: d.Couverture,
  }));

  return {
    data: formattedData.sort((a, b) => {
      if (a.epingle && !b.epingle) return -1;
      if (!a.epingle && b.epingle) return 1;

      return b.dateCreation.getTime() - a.dateCreation.getTime();
    }),
    pagination: actus.meta.pagination,
  };
};
