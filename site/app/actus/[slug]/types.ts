import {StrapiItem} from 'src/strapi/StrapiItem';

export type ArticleData = {
  titre: string;
  couverture: StrapiItem;
  dateCreation: Date;
  dateEdition: Date;
  contenu: SectionArticleData[];
  prevId: number | null;
  nextId: number | null;
};

export type SectionArticleData = {
  type: 'paragraphe' | 'image' | 'gallerie' | 'video' | 'info';
  data: ParagrapheArticleData | ImageArticleData | GallerieArticleData | string;
};

export type ParagrapheArticleData = {
  titre?: string;
  texte?: string;
  image?: StrapiItem;
  alignementImage?: string;
  legendeImage?: string;
};

export type ImageArticleData = {
  data: StrapiItem;
  legende?: string;
};

export type GallerieArticleData = {
  data: StrapiItem[];
  colonnes: number;
  legende?: string;
};

export type ContenuArticleFetchedData = (
  | ParagrapheFetchedData
  | ImageFetchedData
  | GallerieFetchedData
  | VideoFetchedData
  | InfoFetchedData
)[];

export type ParagrapheFetchedData = {
  __component: string;
  Titre: string;
  Texte: string;
  Image: {data: StrapiItem};
  AlignementImage: string;
  LegendeImage: string;
};

export type ImageFetchedData = {
  __component: string;
  Image: {data: StrapiItem};
  Legende: string;
};

export type GallerieFetchedData = {
  __component: string;
  Gallerie: {data: StrapiItem[]};
  NombreColonnes: number;
  Legende: string;
};

export type VideoFetchedData = {
  __component: string;
  URL: string;
};

export type InfoFetchedData = {
  __component: string;
  Texte: string;
};
