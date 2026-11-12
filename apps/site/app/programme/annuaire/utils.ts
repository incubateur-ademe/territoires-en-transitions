'use server';

// Server Action : STRAPI_KEY n'existe que côté serveur, un appel direct
// depuis le navigateur partait sans clé (401) et l'annuaire restait vide.
import { fetchCollection } from '@/site/src/strapi/strapi';
import { StrapiMedia } from '@/site/src/strapi/types';

/** Content-type `api/conseiller` ; `photo` n'est présente que si demandée. */
export type Conseiller = {
  prenom: string;
  nom: string;
  structure: string;
  region: string;
  ville: string;
  email: string;
  linkedin: string | null;
  site: string | null;
  photo?: StrapiMedia | null;
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
  const conseillers = await fetchCollection<Conseiller>('conseillers', [
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
    data: conseillers.data ?? [],
    pagination: conseillers.meta.pagination,
  };
};

export const getConseillersCount = async () => {
  // Seul `meta.pagination.total` est lu : inutile de charger les lignes.
  const conseillers = await fetchCollection<Conseiller>('conseillers', [
    ['pagination[pageSize]', '1'],
  ]);
  return conseillers.meta.pagination.total;
};
