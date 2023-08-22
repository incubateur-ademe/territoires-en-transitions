/* eslint-disable react/no-unescaped-entities */
'use client';

import Services from './Services';
import Benefices from './Benefices';
import Etapes from './Etapes';
import Objectifs from './Objectifs';
import {useEffect, useState} from 'react';
import {fetchSingle} from 'src/strapi';
import ProgrammeBanner from './ProgrammeBanner';
import Offre from './Offre';
import Ressources from './Ressources';

type ProgrammeData = {
  titre: string;
  description?: string;
  couvertureURL?: string;
  objectifs: {
    titre: string;
    description: string;
  };
  services: {
    titre: string;
    description: string;
  };
  offre: {
    description: string;
  };
  benefices: {
    titre: string;
    description: string;
  };
  etapes: {
    titre: string;
    description: string;
  };
  ressources: {
    description: string;
    buttons: {
      titre: string;
      href: string;
    }[];
  };
};

const Programme = () => {
  const [data, setData] = useState<ProgrammeData | undefined>();

  const fetchData = async () => {
    const data = await fetchSingle('programme');

    const formattedData = {
      titre: data.attributes.Titre as unknown as string,
      description:
        (data.attributes.Description as unknown as string) ?? undefined,
      couvertureURL:
        (data.attributes.YoutubeURL as unknown as string) ?? undefined,
      objectifs: {
        titre: data.attributes.Objectifs.Titre as unknown as string,
        description: data.attributes.Objectifs.Description as unknown as string,
      },
      services: {
        titre: data.attributes.Services.Titre as unknown as string,
        description: data.attributes.Services.Description as unknown as string,
      },
      offre: {
        description: data.attributes.Offre.Description as unknown as string,
      },
      benefices: {
        titre: data.attributes.Benefices.Titre as unknown as string,
        description: data.attributes.Benefices.Description as unknown as string,
      },
      etapes: {
        titre: data.attributes.Etapes.Titre as unknown as string,
        description: data.attributes.Etapes.Description as unknown as string,
      },
      ressources: {
        description: data.attributes.Ressources
          .Description as unknown as string,
        buttons: [
          {
            titre: 'Règlement CAE',
            href: data.attributes.Ressources
              .ReglementCaeURL as unknown as string,
          },
          {
            titre: 'Règlement ECI',
            href: data.attributes.Ressources
              .ReglementEciURL as unknown as string,
          },
          {
            titre: 'Annuaire des conseillers',
            href: data.attributes.Ressources.AnnuaireURL as unknown as string,
          },
        ],
      },
    };

    setData(formattedData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return data ? (
    <>
      <ProgrammeBanner
        titre={data.titre}
        description={data.description}
        couvertureURL={data.couvertureURL}
      />

      <Objectifs
        titre={data.objectifs.titre}
        description={data.objectifs.description}
      />

      <Services
        titre={data.services.titre}
        description={data.services.description}
      />

      <Offre description={data.offre.description} />

      <Benefices
        titre={data.benefices.titre}
        description={data.benefices.description}
      />

      <Etapes titre={data.etapes.titre} description={data.etapes.description} />

      {/* <Section id="carte">
        <h3>De nombreuses collectivités ont déjà franchi le cap !</h3>
      </Section> */}

      <Ressources
        description={data.ressources.description}
        buttons={data.ressources.buttons}
      />
    </>
  ) : null;
};

export default Programme;
