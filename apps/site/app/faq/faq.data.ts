import 'server-only';

import { fetchCollection } from '@/site/src/strapi/strapi';
import { sortByRank } from '@/site/src/utils/sortByRank';
import { FAQ_TABS } from './faq.tabs';

/**
 * Catégories des questions de l'onglet « Démarche PCAET », dans leur ordre
 * d'affichage : reprennent les valeurs du champ `categorie` de la collection
 * Strapi `faq`, et doivent rester identiques.
 */
export const FAQ_CATEGORIES = [
  'Avant de déposer',
  "Pendant l'instruction",
  "Après l'adoption",
] as const;

export type FaqCategorie = (typeof FAQ_CATEGORIES)[number];

/** Collection `faq` */
export type Faq = {
  Rang: number | null;
  Titre: string;
  Contenu: string;
  onglet: (typeof FAQ_TABS)[number]['title'];
  categorie: FaqCategorie | null;
};

export type FaqData = {
  /** `documentId` de la question : clé React et identifiant ARIA de l'accordéon. */
  id: string;
  titre: string;
  contenu: string;
  onglet: string;
  categorie: FaqCategorie | null;
};

/** Sans pagination explicite, l'API Strapi s'arrête à 25 questions. */
const PAGE_SIZE = '100';

/** Questions de la FAQ, toutes ou celles d'un onglet, dans l'ordre de leur rang. */
export const listFaqQuestions = async (onglet?: string): Promise<FaqData[]> => {
  const { data } = await fetchCollection<Faq>('faqs', [
    ['pagination[pageSize]', PAGE_SIZE],
    ...(onglet ? [['filters[onglet][$eq]', onglet] as [string, string]] : []),
  ]);

  return data
    ? sortByRank(data).map((item) => ({
        id: item.documentId,
        titre: item.Titre,
        contenu: item.Contenu,
        onglet: item.onglet,
        categorie: item.categorie,
      }))
    : [];
};
