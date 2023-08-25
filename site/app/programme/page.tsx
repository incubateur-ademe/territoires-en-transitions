/* eslint-disable react/no-unescaped-entities */
'use server';

import Services from './Services';
import Benefices from './Benefices';
import Etapes from './Etapes';
import Objectifs from './Objectifs';
import ProgrammeBanner from './ProgrammeBanner';
import Offre from './Offre';
import Ressources from './Ressources';
import {getData, ProgrammeData} from './utils';
import NoResult from '@components/info/NoResult';

const Programme = async () => {
  const data: ProgrammeData | null = await getData();

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
        contenu={data.objectifs.contenu}
      />

      <Services
        titre={data.services.titre}
        description={data.services.description}
        contenu={data.services.contenu}
      />

      <Offre description={data.offre.description} />

      <Benefices
        titre={data.benefices.titre}
        description={data.benefices.description}
        contenu={data.benefices.contenu}
      />

      <Etapes
        titre={data.etapes.titre}
        description={data.etapes.description}
        contenu={data.etapes.contenu}
      />

      {/* <Section id="carte">
        <h3>De nombreuses collectivités ont déjà franchi le cap !</h3>
      </Section> */}

      <Ressources
        description={data.ressources.description}
        buttons={data.ressources.buttons}
      />
    </>
  ) : (
    <NoResult />
  );
};

export default Programme;
