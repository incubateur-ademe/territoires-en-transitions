// Formes renvoyées par l'API REST de Strapi 5 : les attributs d'une entrée
// sont à plat (plus d'enveloppe `attributes`), les médias, composants et
// relations ne sont plus emballés dans `{ data }`, et chaque entrée porte un
// `documentId` (identifiant public, stable entre brouillon et publication) en
// plus de son `id` numérique interne.

export type StrapiEntryMeta = {
  id: number;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

/** Entrée d'un content-type (collection ou single type). */
export type StrapiEntry<T> = StrapiEntryMeta & T;

/** Composant Strapi : un `id` local à l'entrée, jamais de `documentId`. */
export type StrapiComponent<T> = T & { id: number };

export type StrapiMediaFormat = {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  width: number;
  height: number;
  size: number;
  url: string;
};

/** Fichier de la médiathèque, tel que renvoyé peuplé dans une entrée ou par `/api/upload/files/:id`. */
export type StrapiMedia = StrapiEntryMeta & {
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  formats: Record<string, StrapiMediaFormat> | null;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
};

/**
 * `pagination[start]/[limit]` renvoie `start`, `limit`, `total` ;
 * `pagination[page]/[pageSize]` renvoie `page`, `pageSize`, `pageCount`, `total`.
 */
export type StrapiPagination = {
  total: number;
  start?: number;
  limit?: number;
  page?: number;
  pageSize?: number;
  pageCount?: number;
};

export type StrapiCollection<T> = {
  data: StrapiEntry<T>[];
  meta: { pagination: StrapiPagination };
};

// Composants partagés (strapi/src/components/shared). Un média, un composant
// ou une relation non demandé dans `populate` est absent de la réponse ; demandé
// mais vide, il vaut `null` (ou `[]` pour une liste).

export type Seo = StrapiComponent<{
  metaTitle: string | null;
  metaDescription: string | null;
  metaImage?: StrapiMedia | null;
}>;

export type Bouton = StrapiComponent<{ label: string; url: string | null }>;

export type Temoignage = StrapiComponent<{
  auteur: string;
  role: string;
  temoignage: string;
  portrait?: StrapiMedia | null;
}>;

export type Vignette = StrapiComponent<{
  legende: string;
  image?: StrapiMedia | null;
}>;

export type VignetteAvecTitre = StrapiComponent<{
  titre: string;
  legende: string;
  image?: StrapiMedia | null;
}>;

export type VignetteAvecMarkdown = StrapiComponent<{
  titre: string | null;
  legende: string | null;
  image?: StrapiMedia | null;
}>;

export type VignetteAvecCta = StrapiComponent<{
  titre: string | null;
  legende: string;
  image?: StrapiMedia | null;
  cta: string;
}>;

export type VignetteAvecDetails = StrapiComponent<{
  titre: string | null;
  legende: string;
  image?: StrapiMedia | null;
  details_titre: string | null;
  details_texte: string;
  details_cta?: Bouton | null;
}>;
