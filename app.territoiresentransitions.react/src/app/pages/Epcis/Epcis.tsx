import {AddDialog} from 'app/pages/Epcis/_AddDialog';

import 'app/DesignSystem/buttons.css';
import 'app/DesignSystem/core.css';
import 'app/DesignSystem/variables.css';
import {useEffect, useState} from 'react';
import {SimpleEpciCard} from 'app/pages/Epcis/_SimpleEpciCard';

import {Spacer} from 'ui/shared';
import {epciReadEndpoint} from 'core-logic/api/endpoints/EpciReadEndpoint';
import {EpciRead} from 'generated/dataLayer/epci_read';

const Epcis = () => {
  // const usersEpcis = currentUserEpcis();
  const [activeEpciReads, setActiveEpciReads] = useState<EpciRead[]>([]);
  useEffect(() => {
    epciReadEndpoint // TODO : should be activeEpciReadEndpoint
      .getBy({})
      .then(activeEpciReads => setActiveEpciReads(activeEpciReads));
  }, []);

  return (
    <div className="app fr-container m-5">
      <section className="text-center">
        <h1 className="fr-h1">Bienvenue !</h1>
        <Spacer size={8} />

        <h2 className="fr-h2 text-center mb-8">Rejoindre votre collectivité</h2>
        <div className="my-4">
          Pourquoi pas un petit texte qui explique un peu.
        </div>
        <AddDialog />
      </section>
      <section>
        <Spacer size={8} />
        <h2 className="fr-h2 text-center">
          Consulter les autres collectivités
        </h2>
        <Spacer size={3} />
        <div className="grid grid-cols-3 gap-12">
          {activeEpciReads.map(epci => (
            <SimpleEpciCard epci={epci} key={epci.siren} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Epcis;
