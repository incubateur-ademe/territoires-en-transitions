/* eslint-disable react/no-unescaped-entities */
'use client';

import InfoSection from '@components/sections/InfoSection';
import Section from '@components/sections/Section';
import CodingPicto from 'public/pictogrammes/CodingPicto';
import DocumentPicto from 'public/pictogrammes/DocumentPicto';
import {resources} from './data';
import Services from './Services';
import Benefices from './Benefices';
import Etapes from './Etapes';
import Objectifs from './Objectifs';
import {useEffect, useState} from 'react';
import {fetchSingle} from 'src/strapi';
import ProgrammeBanner from './ProgrammeBanner';

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
  benefices: {
    titre: string;
    description: string;
  };
  etapes: {
    titre: string;
    description: string;
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
      benefices: {
        titre: data.attributes.Benefices.Titre as unknown as string,
        description: data.attributes.Benefices.Description as unknown as string,
      },
      etapes: {
        titre: data.attributes.Etapes.Titre as unknown as string,
        description: data.attributes.Etapes.Description as unknown as string,
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

      <InfoSection
        content="Une offre socle qui comprend deux référentiels d'action Climat-Air-Énergie et Économie Circulaire, hébergés sur notre plateforme numérique"
        buttons={[
          {
            title: 'Créer un compte',
            href: 'https://app.territoiresentransitions.fr/auth/signup',
          },
        ]}
        pictogram={<CodingPicto />}
      />

      <Benefices
        titre={data.benefices.titre}
        description={data.benefices.description}
      />

      <Etapes titre={data.etapes.titre} description={data.etapes.description} />

      {/* <Section id="carte">
        <h3>De nombreuses collectivités ont déjà franchi le cap !</h3>
      </Section> */}

      <InfoSection
        content="Besoin de précisions avant de m'engager !"
        buttons={resources.map(r => ({...r, external: true}))}
        pictogram={<DocumentPicto />}
        customBackground="#6a6af4"
        customTextStyle="text-white font-bold"
      />
    </>
  ) : null;
};

export default Programme;
