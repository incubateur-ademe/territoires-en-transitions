'use server';

import NoResult from '@tet/site/components/info/NoResult';
import Temoignages from './Temoignages';
import Accompagnement from './Accompagnement';
import AccueilBanner from './AccueilBanner';
import Newsletter from './Newsletter';
import DemandeContact from './DemandeContact';
import Communaute from './Communaute';
import Objectifs from './Objectifs';
import { getData } from './utils';
import { TrackPageView } from '@tet/ui';

const Accueil = async () => {
  const data = await getData();

  return (
    <>
      <TrackPageView pageName={'site/accueil'} properties={{}} />

      {data ? (
        <>
          <AccueilBanner {...data.banner} />

          <Accompagnement {...data.accompagnement} />

          <Objectifs {...data.objectifs} />

          <Communaute {...data.collectivites} />

          <DemandeContact {...data.contact} />

          {data.temoignages && <Temoignages {...data.temoignages} />}

          <Newsletter {...data.newsletter} />
        </>
      ) : (
        <NoResult />
      )}
    </>
  );
};

export default Accueil;
