import { StrapiItem } from '@tet/site/src/strapi/StrapiItem';

export type Content = {
  id: number;
  titre?: string;
  description: string;
  image?: StrapiItem;
  href?: string;
};

export type ProgrammeData = {
  titre: string;
  description?: string;
  couvertureURL?: string;
  objectifs: {
    titre: string;
    description: string;
    contenu: Content[] | null;
  };
  services: {
    titre: string;
    description: string;
    contenu: Content[] | null;
  };
  compte: {
    description: string;
  };
  benefices: {
    titre: string;
    description: string;
    contenu: Content[] | null;
  };
  etapes: {
    titre: string;
    description: string;
    contenu: Content[] | null;
  };
  ressources: {
    description: string;
    buttons: {
      titre: string;
      href: string;
    }[];
  };
};
