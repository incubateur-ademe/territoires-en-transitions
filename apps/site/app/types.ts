import { StrapiMedia } from '@/site/src/strapi/types';

// Types associés aux pages actualités et collectivités

export type ArticleData = {
  titre: string;
  couverture: StrapiMedia;
  categories: string[];
  dateCreation: Date;
  dateEdition: Date;
  contenu: SectionArticleData[];
  prevDocumentId: string | null;
  nextDocumentId: string | null;
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
  image?: StrapiMedia | null;
  legendeVisible?: boolean;
};

export type ParagrapheCustomArticleData = ParagrapheArticleData & {
  alignementImage?: string;
};

export type ImageArticleData = {
  data: StrapiMedia | null;
  legendeVisible?: boolean;
};

export type GallerieArticleData = {
  data: StrapiMedia[];
  colonnes: number;
  legende?: string;
  legendeVisible?: boolean;
};

export type BoutonsArticleData = {
  id: number;
  label: string;
  url: string | null;
}[];

export type ContenuArticleFetchedData = (
  | ParagrapheCustomFetchedData
  | ImageFetchedData
  | GallerieFetchedData
  | VideoFetchedData
  | BoutonsFetchedData
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
    Image: StrapiMedia | null;
    LegendeVisible: boolean;
  };
  PatrimoineCollectivite: {
    Texte: string;
    Image: StrapiMedia | null;
    LegendeVisible: boolean;
  };
  ApprovisionnementEnergie: {
    Texte: string;
    Image: StrapiMedia | null;
    LegendeVisible: boolean;
  };
  Mobilite: {
    Texte: string;
    Image: StrapiMedia | null;
    LegendeVisible: boolean;
  };
  OrganisationInterne: {
    Texte: string;
    Image: StrapiMedia | null;
    LegendeVisible: boolean;
  };
  CommunicationCooperation: {
    Texte: string;
    Image: StrapiMedia | null;
    LegendeVisible: boolean;
  };
};

export type ParagrapheFetchedData = {
  __component: string;
  Titre: string;
  Texte: string;
  Image: StrapiMedia | null;
  LegendeVisible: boolean;
};

export type ParagrapheCustomFetchedData = ParagrapheFetchedData & {
  AlignementImage: string;
};

export type ImageFetchedData = {
  __component: string;
  Image: StrapiMedia | null;
  LegendeVisible: boolean;
};

export type GallerieFetchedData = {
  __component: string;
  Gallerie: StrapiMedia[];
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
  image?: StrapiMedia | null;
};

export type Vignette = {
  id: number;
  titre?: string;
  legende?: string;
  image?: StrapiMedia | null;
};

export type VignetteAvecDetailsFetchedData = {
  id: number;
  titre?: string;
  legende: string;
  image?: StrapiMedia | null;
  details_titre?: string;
  details_texte: string;
  details_cta?: { label: string; url?: string };
};

export type VignetteAvecDetails = {
  id: number;
  titre?: string;
  legende: string;
  image?: StrapiMedia | null;
  details: {
    titre?: string;
    contenu: string;
    cta?: { label: string; url?: string };
  };
};

