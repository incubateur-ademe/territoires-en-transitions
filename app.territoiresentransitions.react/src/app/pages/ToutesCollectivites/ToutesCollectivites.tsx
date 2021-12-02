import 'app/DesignSystem/buttons.css';
import 'app/DesignSystem/core.css';
import 'app/DesignSystem/variables.css';
import {useEffect, useState} from 'react';

import {Spacer} from 'ui/shared';
import {epciReadEndpoint} from 'core-logic/api/endpoints/EpciReadEndpoint';
import {EpciRead} from 'generated/dataLayer/epci_read';
import {SimpleEpciCard} from 'ui/epcis/SimpleEpciCard';

const ToutesCollectivites = () => {
  const [activeEpciReads, setActiveEpciReads] = useState<EpciRead[]>([]);
  useEffect(() => {
    epciReadEndpoint // TODO : should be activeEpciReadEndpoint
      .getBy({})
      .then(activeEpciReads => setActiveEpciReads(activeEpciReads));
  }, []);

  return (
    <div className="app fr-container m-5">
      <section>
        <h2 className="fr-h2 text-center">Consulter les collectivités</h2>
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

export default ToutesCollectivites;
