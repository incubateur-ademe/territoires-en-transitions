import {StrapiItem} from 'src/strapi/StrapiItem';

export type AccompagnementContent = {
  titre: string;
  description: string;
  image: StrapiItem;
  button: {titre: string; href: string};
};

export type Temoignage = {
  id: number;
  auteur: string;
  description: string;
  contenu: string;
  image: StrapiItem;
};

export type AccueilData = {
  titre: string;
  couverture?: StrapiItem;
  accompagnement: {
    titre: string;
    description: string;
    contenu: AccompagnementContent[];
  };
  temoignages: {
    titre: string;
    description: string;
    contenu: Temoignage[];
  } | null;
  informations: {
    titre: string;
    description: string;
  };
  newsletter: {
    titre: string;
    description: string;
  };
};
