'use server';

import Temoignages from './Temoignages';
import Accompagnement from './Accompagnement';
import Informations from './Informations';
import AccueilBanner from './AccueilBanner';
import Newsletter from './Newsletter';
import {getData} from './utils';
import NoResult from '@components/info/NoResult';
import {AccueilData} from './types';

const Accueil = async () => {
  const data: AccueilData | null = await getData();

  return data ? (
    <>
      <AccueilBanner titre={data.titre} couverture={data.couverture} />

      <Accompagnement {...data.accompagnement} />

      {data.temoignages && <Temoignages {...data.temoignages} />}

      <Informations
        {...data.informations}
        className={
          data.temoignages && data.temoignages.contenu.length > 1
            ? 'bg-primary-1'
            : '#fff'
        }
        pictobackgroundFill={
          data.temoignages && data.temoignages.contenu.length > 1
            ? '#fff'
            : '#FBFCFE'
        }
      />

      <Newsletter
        {...data.newsletter}
        className={
          data.temoignages && data.temoignages.contenu.length > 1
            ? '#fff'
            : 'bg-primary-1'
        }
      />
    </>
  ) : (
    <NoResult />
  );
};

export default Accueil;
