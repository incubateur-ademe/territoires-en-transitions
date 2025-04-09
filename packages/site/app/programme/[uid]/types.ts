import { StrapiItem } from '@/site/src/strapi/StrapiItem';

export type ServicesFetchedData = (
  | ParagrapheFetchedData
  | ListeFetchedData
  | InfoFetchedData
)[];

export type ParagrapheFetchedData = {
  __component: 'services.paragraphe';
  taille_paragraphe?: 'md' | 'lg';
  titre?: string;
  titre_centre?: boolean;
  image_titre?: { data: StrapiItem };
  taille_image_titre?: 'sm' | 'md' | 'lg';
  sous_titre?: string;
  texte?: string;
  images?: { data: StrapiItem[] };
  alignement_image_droite?: boolean;
};

export type ParagrapheData = {
  type: 'paragraphe';
  tailleParagraphe?: 'md' | 'lg';
  titre?: string;
  titreCentre?: boolean;
  imageTitre?: StrapiItem;
  tailleImageTitre?: 'sm' | 'md' | 'lg';
  sousTitre?: string;
  texte?: string;
  images?: StrapiItem[];
  alignementImageDroite?: boolean;
};

export type ListeFetchedData = {
  __component: 'services.liste';
  taille_liste?: 'md' | 'lg';
  titre: string;
  sous_titre?: string;
  introduction?: string;
  liste: {
    id: number;
    pre_titre?: string;
    titre?: string;
    texte: string;
    image?: { data: StrapiItem };
  }[];
  disposition_cartes: 'Gallerie' | 'Grille' | 'Verticale' | 'Vignettes';
};

export type Liste = {
  id: number;
  preTitre?: string;
  titre?: string;
  texte: string;
  image?: StrapiItem;
}[];

export type ListeData = {
  type: 'liste';
  tailleListe?: 'md' | 'lg';
  titre: string;
  sousTitre?: string;
  introduction?: string;
  liste: Liste;
  dispositionCartes: 'Gallerie' | 'Grille' | 'Verticale' | 'Vignettes';
};

export type InfoFetchedData = {
  __component: 'services.info';
  titre: string;
  boutons: {
    label: string;
    url?: string;
  }[];
};

export type InfoData = {
  type: 'info';
  titre: string;
  boutons: {
    label: string;
    url?: string;
  }[];
};
