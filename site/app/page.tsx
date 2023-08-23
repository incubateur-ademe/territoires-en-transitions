'use server';

import Temoignages from './Temoignages';
import Accompagnement from './Accompagnement';
import Informations from './Informations';
import AccueilBanner from './AccueilBanner';
import Newsletter from './Newsletter';
import {AccueilData, getData} from './utils';

const Accueil = async () => {
  const data: AccueilData = await getData();

  return data ? (
    <>
      <AccueilBanner titre={data.titre} couverture={data.couverture} />

      <Accompagnement
        titre={data.accompagnement.titre}
        description={data.accompagnement.description}
        contenu={data.accompagnement.contenu}
      />

      <Temoignages
        titre={data.temoignages.titre}
        description={data.temoignages.description}
        contenu={data.temoignages.contenu}
      />

      <Informations
        titre={data.informations.titre}
        description={data.informations.description}
      />

      <Newsletter
        titre={data.newsletter.titre}
        description={data.newsletter.description}
      />
    </>
  ) : null;
};

export default Accueil;
