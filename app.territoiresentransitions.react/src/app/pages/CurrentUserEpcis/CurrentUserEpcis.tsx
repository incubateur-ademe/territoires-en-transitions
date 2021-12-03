import 'app/DesignSystem/buttons.css';
import 'app/DesignSystem/core.css';
import 'app/DesignSystem/variables.css';

import {OwnedEpciRead} from 'generated/dataLayer';
import {authBloc, AuthBloc} from 'core-logic/observables';
import {autorun, makeAutoObservable, reaction} from 'mobx';
import {SimpleEpciCard} from 'ui/epcis/SimpleEpciCard';
import {AddDialog} from './_AddDialog';
import {ownedEpciReadEndpoint} from 'core-logic/api/endpoints/EpciReadEndpoints';
import {observer} from 'mobx-react-lite';
import {CollectionsBookmarkOutlined} from '@material-ui/icons';
import {forEach} from 'ramda';

export class MyEpcisCardsBloc {
  ownedEpciReads: OwnedEpciRead[] = [];

  constructor() {
    makeAutoObservable(this);
    this.updateOwnedEpciReads(authBloc.userId);
    console.log('construction : ', this.ownedEpciReads);

    reaction(
      () => authBloc.userId,
      userId => {
        this.updateOwnedEpciReads(userId);
        console.log('reaction: ', this.ownedEpciReads);
      }
    );
  }

  private updateOwnedEpciReads(userId: string | null) {
    console.log('current user is', userId);
    ownedEpciReadEndpoint.getBy({}).then(retrieved => {
      this.ownedEpciReads = retrieved;
      console.log('retrieved : ', retrieved);
      console.log('updateOwnedEpciReads', this.ownedEpciReads);
    });
  }
}
const LogNom = observer(({nom}: {nom: string}) => {
  console.log('LogNom ');
  return <div>nom: {nom}</div>;
});

const MyEpciCards = observer(
  ({ownedEpciReads}: {ownedEpciReads: OwnedEpciRead[]}) => {
    console.log(
      'MyEPciCards: ',
      ownedEpciReads.map(lala => lala.nom)
    );
    const lulu: OwnedEpciRead[] = ownedEpciReads.map(lala => ({
      nom: lala.nom,
      siren: lala.siren,
      role_name: 'agent',
    }));
    console.log('lulu : ', lulu);
    return (
      !!ownedEpciReads[0] && (
        <div>
          {ownedEpciReads.length}
          <SimpleEpciCard epci={lulu[0]} />
          {lulu.map(lu => {
            <SimpleEpciCard
              key={lu.siren}
              epci={{
                nom: lu.nom,
                role_name: 'referent',
                siren: lu.siren,
              }}
            />;
          })}
        </div>
      )
    );
  }
);

const epciCardsBloc = new MyEpcisCardsBloc();

autorun(() => {
  console.log(
    'autorun :',
    epciCardsBloc.ownedEpciReads.map(obs => {
      obs.nom;
    })
  );
});

const CurrentUserEpcis = () => {
  console.log('in compontene: ', epciCardsBloc.ownedEpciReads);
  return (
    <div className="app fr-container m-5">
      <section className="text-center">
        <h1 className="fr-h1">Mes collectivités</h1>
        <MyEpciCards ownedEpciReads={epciCardsBloc.ownedEpciReads} />
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
