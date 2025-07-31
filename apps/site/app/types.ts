import { StrapiItem } from '@/site/src/strapi/StrapiItem';

// Types associés aux pages actualités et collectivités

export type ArticleData = {
  titre: string;
  couverture: StrapiItem;
  categories: string[];
  dateCreation: Date;
  dateEdition: Date;
  contenu: SectionArticleData[];
  prevId: number | null;
  nextId: number | null;
};

export type CollectiviteData = {
  logos?: StrapiItem[];
  description?: string;
  contenu: SectionCollectiviteData[];
};

export type SectionArticleData = {
  type: 'paragraphe' | 'image' | 'gallerie' | 'video' | 'boutons' | 'info';
  data:
    | ParagrapheCustomArticleData
    | ImageArticleData
    | GallerieArticleData
    | BoutonsArticleData
    | string;
};

export type SectionCollectiviteData = {
  type:
    | 'performance'
    | 'citation'
    | 'actionsCAE'
    | 'paragraphe'
    | 'image'
    | 'gallerie'
    | 'video'
    | 'info';
  data:
    | ParagrapheArticleData
    | ParagrapheArticleData[]
    | ParagrapheCustomArticleData
    | ImageArticleData
    | GallerieArticleData
    | BoutonsArticleData
    | string;
};

export type ParagrapheArticleData = {
  titre?: string;
  texte?: string;
  image?: StrapiItem;
  legendeVisible?: boolean;
};

export type ParagrapheCustomArticleData = ParagrapheArticleData & {
  alignementImage?: string;
};

export type ImageArticleData = {
  data: StrapiItem;
  legendeVisible?: boolean;
};

export type GallerieArticleData = {
  data: StrapiItem[];
  colonnes: number;
  legende?: string;
  legendeVisible?: boolean;
};

export type BoutonsArticleData = {
  id: number;
  label: string;
  url: string | null;
}[];

export type CitationCollectiviteData = {
  texte: string;
  auteur: string;
  description?: string;
};

export type ContenuArticleFetchedData = (
  | ParagrapheCustomFetchedData
  | ImageFetchedData
  | GallerieFetchedData
  | VideoFetchedData
  | BoutonsFetchedData
  | InfoFetchedData
)[];

export type ContenuCollectiviteFetchedData = (
  | CitationFetchedData
  | ActionsCaeFetchedData
  | ParagrapheFetchedData
  | ParagrapheCustomFetchedData
  | ImageFetchedData
  | GallerieFetchedData
  | VideoFetchedData
  | InfoFetchedData
)[];

export type CitationFetchedData = {
  __component: string;
  Texte: string;
  Auteur: string;
  Description: string;
};

export type ActionsCaeFetchedData = {
  __component: string;
  PlanificationTerritoriale: {
    Texte: string;
    Image: { data: StrapiItem };
    LegendeVisible: boolean;
  };
  PatrimoineCollectivite: {
    Texte: string;
    Image: { data: StrapiItem };
    LegendeVisible: boolean;
  };
  ApprovisionnementEnergie: {
    Texte: string;
    Image: { data: StrapiItem };
    LegendeVisible: boolean;
  };
  Mobilite: {
    Texte: string;
    Image: { data: StrapiItem };
    LegendeVisible: boolean;
  };
  OrganisationInterne: {
    Texte: string;
    Image: { data: StrapiItem };
    LegendeVisible: boolean;
  };
  CommunicationCooperation: {
    Texte: string;
    Image: { data: StrapiItem };
    LegendeVisible: boolean;
  };
};

export type ParagrapheFetchedData = {
  __component: string;
  Titre: string;
  Texte: string;
  Image: { data: StrapiItem };
  LegendeVisible: boolean;
};

export type ParagrapheCustomFetchedData = ParagrapheFetchedData & {
  AlignementImage: string;
};

export type ImageFetchedData = {
  __component: string;
  Image: { data: StrapiItem };
  LegendeVisible: boolean;
};

export type GallerieFetchedData = {
  __component: string;
  Gallerie: { data: StrapiItem[] };
  NombreColonnes: number;
  Legende: string;
  LegendeVisible: boolean;
};

export type VideoFetchedData = {
  __component: string;
  URL: string;
};

export type BoutonsFetchedData = {
  __component: string;
  boutons: { id: number; label: string; url: string }[];
};

export type InfoFetchedData = {
  __component: string;
  Texte: string;
};

export type EtoilesLabel = 0 | 1 | 2 | 3 | 4 | 5;

// Composants Strapi

export type VignetteFetchedData = {
  id: number;
  titre?: string;
  legende?: string;
  image?: { data: StrapiItem };
};

export type Vignette = {
  id: number;
  titre?: string;
  legende?: string;
  image?: StrapiItem;
};

export type VignetteAvecDetailsFetchedData = {
  id: number;
  titre?: string;
  legende: string;
  image?: { data: StrapiItem };
  details_titre?: string;
  details_texte: string;
  details_cta?: { label: string; url?: string };
};

export type VignetteAvecDetails = {
  id: number;
  titre?: string;
  legende: string;
  image?: StrapiItem;
  details: {
    titre?: string;
    contenu: string;
    cta?: { label: string; url?: string };
  };
};

export type VignetteAvecCtaFetchedData = {
  id: number;
  titre?: string;
  legende: string;
  image: { data: StrapiItem };
  cta: string;
};

export type VignetteAvecCta = {
  id: number;
  titre?: string;
  legende: string;
  image: StrapiItem;
  cta: string;
};
