'use server';

import NoResult from '@components/info/NoResult';
import {getStrapiData} from './utils';
import HeaderTrajectoire from './HeaderTrajectoire';
import PresentationTrajectoire from './PresentationTrajectoire';
import Methode from './Methode';
import Webinaire from './Webinaire';
import Calcul from './Calcul';
import Documentation from './Documentation';
import TemoignagesTrajectoire from './TemoignagesTrajectoire';

const PageTrajectoire = async () => {
  const data = await getStrapiData();

  return data ? (
    <div className="grow">
      <HeaderTrajectoire {...data.header} />

      <PresentationTrajectoire {...data.presentation} />

      <Methode {...data.methode} />

      {data.webinaire.url && <Webinaire {...data.webinaire} />}

      <Calcul
        {...data.calcul}
        backgroundColor={data.webinaire.url ? 'bg-primary-1' : 'bg-primary-0'}
      />

      <TemoignagesTrajectoire temoignages={data.temoignages} />

      <Documentation {...data.documentation} />
    </div>
  ) : (
    <NoResult />
  );
};

export default PageTrajectoire;
