'use server';

import Temoignages from './Temoignages';
import Accompagnement from './Accompagnement';
import AccueilBanner from './AccueilBanner';
import Newsletter from './Newsletter';
import {getData} from './utils';
import NoResult from '@components/info/NoResult';
import DemandeContact from './DemandeContact';
import Communaute from './Communaute';
import Objectifs from './Objectifs';

const Accueil = async () => {
  const data = await getData();

  return data ? (
    <>
      <AccueilBanner
        couverture={data.couverture}
        couvertureMobile={data.couverture}
      />

      <Accompagnement
        titre={data.accompagnement.titre}
        description={data.accompagnement.description}
        contenu={data.accompagnement.contenu}
      />

      <Objectifs
        titre="Pourquoi engager votre collectivité ?"
        contenu={[
          {id: 1, description: 'test'},
          {id: 2, description: 'test'},
          {id: 3, description: 'test'},
          {id: 4, description: 'test'},
          {id: 5, description: 'test'},
        ]}
      />

      <Communaute titre="Rejoignez une communauté de collectivités engagées" />

      <DemandeContact
        description="Vous souhaitez agir mais n'êtes pas sûr de ce qu'il vous faut ?"
        cta="Je souhaite être recontacté"
      />

      {data.temoignages && (
        <Temoignages
          titre={data.temoignages.titre}
          contenu={data.temoignages.contenu}
        />
      )}

      <Newsletter
        titre={data.newsletter.titre}
        description={data.newsletter.description}
      />
    </>
  ) : (
    <NoResult />
  );
};

export default Accueil;
