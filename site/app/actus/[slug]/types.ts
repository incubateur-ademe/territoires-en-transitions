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
  data: ParagrapheArticleData | StrapiItem | StrapiItem[] | string;
};

export type ParagrapheArticleData = {
  titre?: string;
  texte?: string;
  image?: StrapiItem;
  alignementImage?: string;
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
};

export type ImageFetchedData = {
  __component: string;
  Image: {data: StrapiItem};
};

export type GallerieFetchedData = {
  __component: string;
  Gallerie: {data: StrapiItem[]};
};

export type VideoFetchedData = {
  __component: string;
  URL: string;
};

export type InfoFetchedData = {
  __component: string;
  Texte: string;
};
