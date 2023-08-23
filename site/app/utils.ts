import {fetchCollection, fetchSingle} from 'src/strapi';
import {StrapiItem} from 'src/StrapiItem';
import {AccompagnementContent} from './Accompagnement';
import {Temoignage} from './Temoignages';

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
  };
  informations: {
    titre: string;
    description: string;
  };
  newsletter: {
    titre: string;
    description: string;
  };
};

export const getData = async () => {
  // Fetch du contenu de la page d'accueil
  const data = await fetchSingle('accueil', [
    ['populate[0]', 'Titre'],
    ['populate[1]', 'Couverture'],
    ['populate[2]', 'Accompagnement'],
    ['populate[3]', 'Accompagnement.Programme'],
    ['populate[4]', 'Accompagnement.Programme.Image'],
    ['populate[5]', 'Accompagnement.Compte'],
    ['populate[6]', 'Accompagnement.Compte.Image'],
    ['populate[7]', 'Temoignages'],
    ['populate[8]', 'Informations'],
    ['populate[9]', 'Newsletter'],
  ]);

  // Fetch de la liste des témoignages
  const temoignages = await fetchCollection('temoignages');

  // Formattage de la data
  const formattedData = {
    titre: data.attributes.Titre as unknown as string,
    couverture:
      (data.attributes.Couverture.data as unknown as StrapiItem) ?? undefined,
    accompagnement: {
      titre: data.attributes.Accompagnement.Titre as unknown as string,
      description: data.attributes.Accompagnement
        .Description as unknown as string,
      contenu: [
        {
          titre: data.attributes.Accompagnement.Programme
            .Titre as unknown as string,
          description: data.attributes.Accompagnement.Programme
            .Description as unknown as string,
          image: data.attributes.Accompagnement.Programme.Image
            .data as unknown as StrapiItem,
          button: {titre: 'Découvrir le programme', href: '/programme'},
        },
        {
          titre: data.attributes.Accompagnement.Compte
            .Titre as unknown as string,
          description: data.attributes.Accompagnement.Compte
            .Description as unknown as string,
          image: data.attributes.Accompagnement.Compte.Image
            .data as unknown as StrapiItem,
          button: {
            titre: 'Créer un compte',
            href: 'https://app.territoiresentransitions.fr/auth/signup',
          },
        },
      ],
    },
    temoignages: {
      titre: data.attributes.Temoignages.Titre as unknown as string,
      description: data.attributes.Temoignages.Description as unknown as string,
      contenu: temoignages.map(d => ({
        id: d.id,
        auteur: d.attributes.Auteur as unknown as string,
        description:
          (d.attributes.Description as unknown as string) ?? undefined,
        contenu: d.attributes.Contenu as unknown as string,
        image: (d.attributes.Image.data as unknown as StrapiItem) ?? undefined,
      })),
    },
    informations: {
      titre: data.attributes.Informations.Titre as unknown as string,
      description: data.attributes.Informations
        .Description as unknown as string,
    },
    newsletter: {
      titre: data.attributes.Newsletter.Titre as unknown as string,
      description: data.attributes.Newsletter.Description as unknown as string,
    },
  };

  return formattedData;
};
