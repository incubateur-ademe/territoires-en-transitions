'use client';

import Temoignages from './Temoignages';
import {useEffect, useState} from 'react';
import {fetchSingle} from 'src/strapi';
import {StrapiItem} from 'src/StrapiItem';
import Accompagnement from './Accompagnement';
import Informations from './Informations';
import AccueilBanner from './AccueilBanner';
import Newsletter from './Newsletter';

type AccueilData = {
  titre: string;
  couverture?: StrapiItem;
  accompagnement: {
    titre: string;
    description: string;
    contenu: {
      titre: string;
      description: string;
      image: StrapiItem;
      button: {titre: string; href: string};
    }[];
  };
  temoignages: {
    titre: string;
    description: string;
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

export default function Accueil() {
  const [data, setData] = useState<AccueilData | undefined>();

  const fetchData = async () => {
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
        description: data.attributes.Temoignages
          .Description as unknown as string,
      },
      informations: {
        titre: data.attributes.Informations.Titre as unknown as string,
        description: data.attributes.Informations
          .Description as unknown as string,
      },
      newsletter: {
        titre: data.attributes.Newsletter.Titre as unknown as string,
        description: data.attributes.Newsletter
          .Description as unknown as string,
      },
    };

    setData(formattedData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return data ? (
    <>
      <AccueilBanner titre={data.titre} couverture={data.couverture} />

      <Accompagnement
        titre={data.accompagnement.titre}
        description={data.accompagnement.description}
        contenu={data.accompagnement.contenu}
      />

      <Temoignages
        titre={data.temoignages.titre}
        description={data.temoignages.description}
      />

      <Informations
        titre={data.informations.titre}
        description={data.informations.description}
      />

      <Newsletter
        titre={data.newsletter.titre}
        description={data.newsletter.description}
      />
    </>
  ) : null;
}
