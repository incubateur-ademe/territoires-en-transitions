import { ContenuArticleFetchedData } from '@/site/app/types';
import { fetchCollection } from '@/site/src/strapi/strapi';
import { Seo, StrapiEntry, StrapiMedia } from '@/site/src/strapi/types';

/** Content-type `api/actualites-categorie`. */
export type ActualiteCategorie = { nom: string | null };

/** Content-type `api/actualite` ; les champs `?:` ne sont là que s'ils ont été demandés dans `populate`. */
export type Actualite = {
  Titre: string;
  DateCreation: string | null;
  Epingle: boolean | null;
  Resume: string | null;
  Couverture: StrapiMedia;
  categories?: StrapiEntry<ActualiteCategorie>[];
  seo?: Seo | null;
  Sections?: ContenuArticleFetchedData;
};

export type ActuCard = {
  documentId: string;
  titre: string;
  dateCreation: Date;
  epingle: boolean;
  categories: string[];
  resume?: string;
  couverture: StrapiMedia;
};

export const getCategoriesNoms = (
  categories: StrapiEntry<ActualiteCategorie>[] | undefined
): string[] =>
  (categories ?? [])
    .map((categorie) => categorie.nom)
    .filter((nom): nom is string => !!nom);

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
