'use server';

import NoResult from '@/site/components/info/NoResult';
import Accompagnement from './Accompagnement';
import AccueilBanner from './AccueilBanner';
import Communaute from './Communaute';
import DemandeContact from './DemandeContact';
import Newsletter from './Newsletter';
import Objectifs from './Objectifs';
import Temoignages from './Temoignages';
import { getData } from './utils';

const Accueil = async () => {
  const data = await getData();

  if (!data) {
    return <NoResult />;
  }

  return (
    <>
      <AccueilBanner {...data.banner} />

      <Accompagnement {...data.accompagnement} />

      <Objectifs {...data.objectifs} />

      <Communaute {...data.collectivites} />

      <DemandeContact {...data.contact} />

      {data.temoignages && <Temoignages {...data.temoignages} />}

      <Newsletter {...data.newsletter} />
    </>
  );
};

export default Accueil;
