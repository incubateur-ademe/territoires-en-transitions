import {StrapiItem} from 'src/strapi/StrapiItem';

export type ServicesFetchedData = (
  | IntroductionFetchedData
  | BeneficesFetchedData
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
  image_titre?: StrapiItem;
  image_titre_taille?: string;
  texte: string;
  image: StrapiItem;
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
