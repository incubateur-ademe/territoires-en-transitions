'use server';

import NoResult from '@/site/components/info/NoResult';
import Section from '../components/sections/Section';
import Accompagnement from './Accompagnement';
import AccueilHeroSection from './AccueilHeroSection';
import Communaute from './Communaute';
import DemandeContact from './DemandeContact';
import Newsletter from './Newsletter';
import Temoignages from './Temoignages';
import { getData } from './utils';

const Accueil = async () => {
  const data = await getData();

  if (!data) {
    return <NoResult />;
  }

  return (
    <>
      <AccueilHeroSection />
      <Section className="flex items-center">
        <iframe
          width="1062"
          height="597"
          src="https://www.youtube.com/embed/fFyxb7M4Wio"
          title="Présentation de la plateforme"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </Section>

      <Communaute {...data.collectivites} />

      <Accompagnement {...data.accompagnement} />

      <DemandeContact {...data.contact} />

      {data.temoignages && <Temoignages {...data.temoignages} />}

      <Newsletter {...data.newsletter} />
    </>
  );
};

export default Accueil;
