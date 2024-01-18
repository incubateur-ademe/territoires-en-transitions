import {StrapiItem} from 'src/strapi/StrapiItem';

export type ServicesFetchedData = (
  | IntroductionFetchedData
  | ParagrapheFetchedData
  | BeneficesFetchedData
  | ListeFetchedData
)[];

export type IntroductionFetchedData = {
  __component: string;
  titre: string;
  image_titre?: {data: StrapiItem};
  image_titre_taille?: string;
  texte: string;
  image: {data: StrapiItem};
};

export type IntroductionData = {
  type: string;
  titre: string;
  imageTitre?: StrapiItem;
  imageTitreTaille?: string;
  texte: string;
  image: StrapiItem;
};

export type ParagrapheFetchedData = {
  __component: string;
  titre?: string;
  image_titre?: {data: StrapiItem};
  image_titre_taille?: string;
  texte: string;
  images?: {data: StrapiItem[]};
  alignement_image_droite?: boolean;
};

export type ParagrapheData = {
  type: string;
  titre?: string;
  imageTitre?: StrapiItem;
  imageTitreTaille?: string;
  texte: string;
  images?: StrapiItem[];
  alignementImageDroite?: boolean;
};

export type BeneficesFetchedData = {
  __component: string;
  benefices_liste: {
    id: number;
    legende: string;
    image: {data: StrapiItem};
  }[];
};

export type BeneficesData = {
  type: string;
  liste: {
    id: number;
    legende: string;
    image: StrapiItem;
  }[];
};

export type ListeFetchedData = {
  __component: string;
  titre: string;
  sous_titre?: string;
  introduction?: string;
  contenu: {
    id: number;
    titre?: string;
    legende: string;
    image: {data: StrapiItem};
  }[];
};

export type ListeData = {
  type: string;
  titre: string;
  sousTitre?: string;
  introduction?: string;
  contenu: {
    id: number;
    titre?: string;
    legende: string;
    image: StrapiItem;
  }[];
};
