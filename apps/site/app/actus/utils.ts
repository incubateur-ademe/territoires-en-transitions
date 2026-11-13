import { ContenuArticleFetchedData } from '@/site/app/types';
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
