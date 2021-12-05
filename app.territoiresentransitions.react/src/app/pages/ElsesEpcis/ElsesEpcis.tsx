import 'app/DesignSystem/buttons.css';
import 'app/DesignSystem/core.css';
import 'app/DesignSystem/variables.css';
import {useEffect, useState} from 'react';

import {Spacer} from 'ui/shared';
import {elsesEpciReadEndpoint} from 'core-logic/api/endpoints/EpciReadEndpoints';
import {SimpleEpciCard} from 'ui/epcis/SimpleEpciCard';
import {ElsesEpciRead} from 'generated/dataLayer';
import {observer} from 'mobx-react-lite';
import {
  ownedEpciBloc,
  OwnedEpciBloc,
} from 'core-logic/observables/OwnedEpciBloc';

const ElsesEpcisObserver = observer(({bloc}: {bloc: OwnedEpciBloc}) => {
  const [elsesEpciReads, setElsesEpciReads] = useState<ElsesEpciRead[]>([]);
  useEffect(() => {
    elsesEpciReadEndpoint
      .getBy({})
      .then(elsesEpciReads => setElsesEpciReads(elsesEpciReads));
  }, []);

  return (
    <div className="app fr-container m-5">
      <section>
        <h2 className="fr-h2 text-center">
          Consulter les autres collectivités
        </h2>
        <Spacer size={3} />
        <div className="grid grid-cols-3 gap-12">
          {elsesEpciReads.map(epci => {
            if (bloc.ownedEpciSirens.includes(epci.siren)) return null;
            return <SimpleEpciCard epci={epci} key={epci.siren} />;
          })}
        </div>
      </section>
    </div>
  );
});

const ElsesEpcis = () => <ElsesEpcisObserver bloc={ownedEpciBloc} />;

export default ElsesEpcis;
