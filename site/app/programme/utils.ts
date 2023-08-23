import {fetchCollection, fetchSingle} from 'src/strapi';
import {StrapiItem} from 'src/StrapiItem';

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
    contenu: Content[];
  };
  services: {
    titre: string;
    description: string;
    contenu: Content[];
  };
  offre: {
    description: string;
  };
  benefices: {
    titre: string;
    description: string;
    contenu: Content[];
  };
  etapes: {
    titre: string;
    description: string;
    contenu: Content[];
  };
  ressources: {
    description: string;
    buttons: {
      titre: string;
      href: string;
    }[];
  };
};

export const getData = async () => {
  // Fetch de la liste des objectifs
  const objectifs = await fetchCollection('objectifs');

  const formattedObjectifs: Content[] = objectifs.map(d => ({
    id: d.id,
    description: d.attributes.Description as unknown as string,
    image: d.attributes.Pictogramme.data as unknown as StrapiItem,
  }));

  // Fetch de la liste des services
  const services = await fetchCollection('services');

  const formattedServices: Content[] = services.map(d => ({
    id: d.id,
    titre: d.attributes.Titre as unknown as string,
    description: (d.attributes.Description as unknown as string) ?? undefined,
    image: (d.attributes.Image.data as unknown as StrapiItem) ?? undefined,
    href: (d.attributes.URL as unknown as string) ?? undefined,
  }));

  // Fetch de la liste des bénéfices
  const benefices = await fetchCollection('benefices');

  const formattedBenefices: Content[] = benefices.map(d => ({
    id: d.id,
    titre: d.attributes.Titre as unknown as string,
    description: d.attributes.Contenu as unknown as string,
  }));

  // Fetch de la liste des étapes
  const etapes = await fetchCollection('etapes');

  const formattedEtapes: Content[] = etapes.map(d => ({
    id: d.id,
    titre: d.attributes.Titre as unknown as string,
    description: d.attributes.Contenu as unknown as string,
  }));

  // Fetch du contenu de la page programme
  const data = await fetchSingle('programme');

  // Formattage de la data
  const formattedData: ProgrammeData = {
    titre: data.attributes.Titre as unknown as string,
    description:
      (data.attributes.Description as unknown as string) ?? undefined,
    couvertureURL:
      (data.attributes.YoutubeURL as unknown as string) ?? undefined,
    objectifs: {
      titre: data.attributes.Objectifs.Titre as unknown as string,
      description: data.attributes.Objectifs.Description as unknown as string,
      contenu: formattedObjectifs,
    },
    services: {
      titre: data.attributes.Services.Titre as unknown as string,
      description: data.attributes.Services.Description as unknown as string,
      contenu: formattedServices,
    },
    offre: {
      description: data.attributes.Offre.Description as unknown as string,
    },
    benefices: {
      titre: data.attributes.Benefices.Titre as unknown as string,
      description: data.attributes.Benefices.Description as unknown as string,
      contenu: formattedBenefices,
    },
    etapes: {
      titre: data.attributes.Etapes.Titre as unknown as string,
      description: data.attributes.Etapes.Description as unknown as string,
      contenu: formattedEtapes,
    },
    ressources: {
      description: data.attributes.Ressources.Description as unknown as string,
      buttons: [
        {
          titre: 'Règlement CAE',
          href: data.attributes.Ressources.ReglementCaeURL as unknown as string,
        },
        {
          titre: 'Règlement ECI',
          href: data.attributes.Ressources.ReglementEciURL as unknown as string,
        },
        {
          titre: 'Annuaire des conseillers',
          href: data.attributes.Ressources.AnnuaireURL as unknown as string,
        },
      ],
    },
  };

  return formattedData;
};
