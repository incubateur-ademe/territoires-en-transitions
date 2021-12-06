import 'app/DesignSystem/buttons.css';
import 'app/DesignSystem/core.css';
import 'app/DesignSystem/variables.css';

import {OwnedEpciRead} from 'generated/dataLayer';
import {SimpleEpciCard} from 'ui/epcis/SimpleEpciCard';
import {AddDialog} from './_AddDialog';
import {observer} from 'mobx-react-lite';
import {
  ownedEpciBloc,
  OwnedEpciBloc,
} from 'core-logic/observables/OwnedEpciBloc';
import {Spacer} from 'ui/shared';

const MyEpciCards = observer(({bloc}: {bloc: OwnedEpciBloc}) => {
  const ownedEpciReads = bloc.ownedEpciReads;

  return (
    !!ownedEpciReads[0] && (
      <>
        <h2 className="fr-h2">Mes collectivités</h2>
        <div className="grid grid-cols-3 gap-12">
          {ownedEpciReads.map((epci: OwnedEpciRead) => (
            <SimpleEpciCard
              key={epci.siren}
              epci={{
                nom: epci.nom,
                role_name: epci.role_name,
                siren: epci.siren,
              }}
            />
          ))}
        </div>
      </>
    )
  );
});

const CurrentUserEpcis = () => {
  return (
    <div className="app fr-container m-5">
      <section className="text-center">
        {/* <h2 className="fr-h2 text-center mb-8">Sélectionner votre collectivité</h2> */}
        <div className="my-4">
          Pourquoi pas un petit texte qui explique un peu.
        </div>
        <AddDialog />
        <Spacer />

        <MyEpciCards bloc={ownedEpciBloc} />
      </section>
    </div>
  );
};

export default CurrentUserEpcis;
