import 'app/DesignSystem/buttons.css';
import 'app/DesignSystem/core.css';
import 'app/DesignSystem/variables.css';

import {OwnedCollectiviteRead} from 'generated/dataLayer';
import {SimpleCollectiviteCard} from 'ui/collectivites/SimpleCollectiviteCard';
import {SelectCollectiviteDialog} from './_AddDialog';
import {observer} from 'mobx-react-lite';
import {
  ownedCollectiviteBloc,
  OwnedCollectiviteBloc,
} from 'core-logic/observables/OwnedCollectiviteBloc';
import {Spacer} from 'ui/shared';

const MyCollectiviteCards = observer(
  ({bloc}: {bloc: OwnedCollectiviteBloc}) => {
    const ownedCollectiviteReads = bloc.ownedCollectiviteReads;

    return (
      !!ownedCollectiviteReads[0] && (
        <>
          <h2 className="fr-h2">Mes collectivités</h2>
          <div className="grid grid-cols-3 gap-12">
            {ownedCollectiviteReads.map(
              (collectivite: OwnedCollectiviteRead) => (
                <SimpleCollectiviteCard
                  key={collectivite.collectivite_id}
                  collectivite={{
                    nom: collectivite.nom,
                    role_name: collectivite.role_name,
                    collectivite_id: collectivite.collectivite_id,
                  }}
                />
              )
            )}
          </div>
        </>
      )
    );
  }
);

const CurrentUserCollectivites = () => {
  return (
    <div className="app fr-container m-5">
      <section className="text-center">
        {/* <h2 className="fr-h2 text-center mb-8">Sélectionner votre collectivité</h2> */}
        <div className="my-4">
          Pourquoi pas un petit texte qui explique un peu.
        </div>
        <SelectCollectiviteDialog />
        <Spacer />

        <MyCollectiviteCards bloc={ownedCollectiviteBloc} />
      </section>
    </div>
  );
};

export default CurrentUserCollectivites;
