/* eslint-disable react/no-unescaped-entities */
import InfoSection from '@components/sections/InfoSection';
import Section from '@components/sections/Section';
import CodingPicto from 'public/pictogrammes/CodingPicto';
import DocumentPicto from 'public/pictogrammes/DocumentPicto';
import {resources} from './data';
import Services from './Services';
import Benefices from './Benefices';
import Etapes from './Etapes';
import Objectifs from './Objectifs';

const Programme = () => {
  return (
    <>
      <Section className="flex-col">
        <h2>Découvrez le programme Territoire Engagé Transition Écologique</h2>
        <p className="text-[1.375rem]">
          L'outil opérationnel de planification écologique qui met à votre
          disposition une ingénierie territoriale et un accompagnement
          personnalisé.
        </p>
        <iframe
          className="aspect-video w-full lg:w-4/5 mx-auto"
          src="https://www.youtube.com/embed/gAc_B6j1qcY"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title="Découvrez le programme Territoire Engagé Transition Écologique"
        />
      </Section>

      <Objectifs />

      <Services />

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

      <Benefices />

      <Etapes />

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
  );
};

export default Programme;
