import 'server-only';

import { fetchCollection } from '@/site/src/strapi/strapi';
import { sortByRank } from '@/site/src/utils/sortByRank';

export type FaqData = {
  id: string;
  titre: string;
  contenu: string;
  onglet: string;
};

/** Sans pagination explicite, l'API Strapi s'arrête à 25 questions. */
const PAGE_SIZE = '100';

/** Questions de la FAQ, toutes ou celles d'un onglet, dans l'ordre de leur rang. */
export const listFaqQuestions = async (onglet?: string): Promise<FaqData[]> => {
  const { data } = await fetchCollection('faqs', [
    ['pagination[pageSize]', PAGE_SIZE],
    ...(onglet ? [['filters[onglet][$eq]', onglet] as [string, string]] : []),
  ]);

  return data
    ? sortByRank(data).map((item) => ({
        id: item.id.toString(),
        titre: item.attributes.Titre as unknown as string,
        contenu: item.attributes.Contenu as unknown as string,
        onglet: item.attributes.onglet as unknown as string,
      }))
    : [];
};
