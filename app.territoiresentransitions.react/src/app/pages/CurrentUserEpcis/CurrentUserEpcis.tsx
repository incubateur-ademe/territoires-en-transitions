import 'app/DesignSystem/buttons.css';
import 'app/DesignSystem/core.css';
import 'app/DesignSystem/variables.css';

import {OwnedEpciRead} from 'generated/dataLayer';
import {authBloc, AuthBloc} from 'core-logic/observables';
import {makeAutoObservable, reaction} from 'mobx';
import {SimpleEpciCard} from 'ui/epcis/SimpleEpciCard';
import {AddDialog} from './_AddDialog';
import {ownedEpciReadEndpoint} from 'core-logic/api/endpoints/EpciReadEndpoints';
import {observer} from 'mobx-react-lite';

export class MyEpcisCardsBloc {
  private _ownedEpciReads: OwnedEpciRead[] = [];
  constructor(authBloc: AuthBloc) {
    makeAutoObservable(this);
    this.handleUserId(authBloc.userId);
    reaction(
      () => authBloc.userId,
      userId => this.handleUserId(userId)
    );
  }

  private handleUserId(userId: string | null) {
    console.log('current user is', userId);
    ownedEpciReadEndpoint
      .getBy({})
      .then(retrieved => (this._ownedEpciReads = retrieved));
  }

  get ownedEpciReads() {
    return this._ownedEpciReads;
  }
}

const myEpciCardsBloc = new MyEpcisCardsBloc(authBloc);

const MyEpciCards = observer(({bloc}: {bloc: MyEpcisCardsBloc}) => (
  <div>
    {bloc.ownedEpciReads.map(ownedEpciRead => {
      <div key={ownedEpciRead.siren}>
        <SimpleEpciCard epci={ownedEpciRead} />
        {ownedEpciRead.nom}
      </div>;
    })}
  </div>
));

const CurrentUserEpcis = () => {
  return (
    <div className="app fr-container m-5">
      <section className="text-center">
        <h1 className="fr-h1">Mes collectivités</h1>
        <MyEpciCards bloc={myEpciCardsBloc} />

        <h2 className="fr-h2 text-center mb-8">Rejoindre votre collectivité</h2>
        <div className="my-4">
          Pourquoi pas un petit texte qui explique un peu.
        </div>
        <AddDialog />
      </section>
    </div>
  );
};

export default CurrentUserEpcis;
