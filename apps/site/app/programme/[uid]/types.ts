import { ButtonsListType } from '@/site/components/buttons/ButtonsList';
import {
  Bouton,
  Seo,
  StrapiComponent,
  StrapiMedia,
} from '@/site/src/strapi/types';

// Content-type `api/service`. `seo`, `image` et `contenu` ne sont présents
// que lorsqu'ils sont demandés dans `populate` (la page programme ne charge
// que `image` de la relation `services_liste_rel`).
export type Service = {
  seo?: Seo | null;
  uid: string;
  titre: string;
  description_markdown: string;
  image?: StrapiMedia;
  sous_page: boolean | null;
  contenu?: ServiceContenu[];
};

/** Dynamic zone `contenu` : chaque composant porte son `__component`. */
export type ServiceContenu =
  | ParagrapheFetchedData
  | ListeFetchedData
  | InfoFetchedData;

export type ParagrapheFetchedData = StrapiComponent<{
  __component: 'services.paragraphe';
  taille_paragraphe: 'md' | 'lg' | null;
  titre: string | null;
  titre_centre: boolean | null;
  image_titre?: StrapiMedia | null;
  taille_image_titre: 'sm' | 'md' | 'lg' | null;
  sous_titre: string | null;
  texte: string | null;
  alignement_image_droite: boolean | null;
  images?: StrapiMedia[];
}>;

export type ParagrapheData = {
  type: 'paragraphe';
  tailleParagraphe: 'md' | 'lg' | null;
  titre: string | null;
  titreCentre: boolean | null;
  imageTitre?: StrapiMedia | null;
  tailleImageTitre: 'sm' | 'md' | 'lg' | null;
  sousTitre: string | null;
  texte: string | null;
  images?: StrapiMedia[];
  alignementImageDroite: boolean | null;
};

/** Composant `services.carte` (le champ `icone` n'existe plus en v5). */
export type CarteFetchedData = StrapiComponent<{
  pre_titre: string | null;
  titre: string | null;
  texte: string;
  image?: StrapiMedia | null;
  boutons: Bouton[];
}>;

export type ListeFetchedData = StrapiComponent<{
  __component: 'services.liste';
  taille_liste: 'md' | 'lg' | null;
  titre: string;
  sous_titre: string | null;
  introduction: string | null;
  liste: CarteFetchedData[];
  disposition_cartes: 'Gallerie' | 'Grille' | 'Verticale' | 'Vignettes';
}>;

export type Liste = {
  id: number;
  preTitre: string | null;
  titre: string | null;
  texte: string;
  image?: StrapiMedia | null;
  boutons: ButtonsListType;
}[];

export type ListeData = {
  type: 'liste';
  tailleListe: 'md' | 'lg' | null;
  titre: string;
  sousTitre: string | null;
  introduction: string | null;
  liste: Liste;
  dispositionCartes: 'Gallerie' | 'Grille' | 'Verticale' | 'Vignettes';
};

export type InfoFetchedData = StrapiComponent<{
  __component: 'services.info';
  titre: string;
  boutons: Bouton[];
}>;

export type InfoData = {
  type: 'info';
  titre: string;
  boutons: ButtonsListType;
};

export type ServiceSection = ParagrapheData | ListeData | InfoData;
