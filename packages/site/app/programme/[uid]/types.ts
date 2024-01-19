import {StrapiItem} from 'src/strapi/StrapiItem';

export type ServicesFetchedData = (
  | ParagrapheFetchedData
  | BeneficesFetchedData
  | ListeFetchedData
  | ListeCartesFetchedData
)[];

export type ParagrapheFetchedData = {
  __component: string;
  taille_paragraphe?: 'md' | 'lg';
  titre?: string;
  image_titre?: {data: StrapiItem};
  taille_image_titre?: 'sm' | 'md' | 'lg';
  texte: string;
  images?: {data: StrapiItem[]};
  alignement_image_droite?: boolean;
};

export type ParagrapheData = {
  type: string;
  tailleParagraphe?: 'md' | 'lg';
  titre?: string;
  imageTitre?: StrapiItem;
  tailleImageTitre?: 'sm' | 'md' | 'lg';
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
    image?: {data: StrapiItem};
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
    image?: StrapiItem;
  }[];
};

export type ListeCartesFetchedData = {
  __component: string;
  titre: string;
  introduction?: string;
  liste: {
    id: number;
    pre_titre?: string;
    titre: string;
    texte: string;
    image?: {data: StrapiItem};
  }[];
  disposition_cartes: 'grille' | 'gallerie';
};

export type ListeCartesData = {
  type: string;
  titre: string;
  introduction?: string;
  liste: {
    id: number;
    preTitre?: string;
    titre: string;
    texte: string;
    image?: StrapiItem;
  }[];
  dispositionCartes: 'grille' | 'gallerie';
};
