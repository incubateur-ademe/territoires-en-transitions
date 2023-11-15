'use server';

import NoResult from '@components/info/NoResult';
import AvantagesPlateforme from './AvantagesPlateforme';
import EquipePlateforme from './EquipePlateforme';
import FonctionnalitesPlateforme from './FonctionnalitesPlateforme';
import HeaderPlateforme from './HeaderPlateforme';
import QuestionsPlateforme from './QuestionsPlateforme';
import TemoignagesPlateforme from './TemoignagesPlateforme';
import {getStrapiData} from './utils';

const OutilNumerique = async () => {
  const strapiData = await getStrapiData();

  return strapiData ? (
    <div className="grow">
      <HeaderPlateforme {...strapiData.header} />

      <AvantagesPlateforme avantages={strapiData.avantages} />

      <FonctionnalitesPlateforme {...strapiData.fonctionnalites} />

      <TemoignagesPlateforme temoignages={strapiData.temoignages} />

      <EquipePlateforme {...strapiData.equipe} />

      <QuestionsPlateforme {...strapiData.questions} />
    </div>
  ) : (
    <NoResult />
  );
};

export default OutilNumerique;
