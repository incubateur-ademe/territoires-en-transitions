import {OwnedCollectiviteRead} from 'generated/dataLayer';
import {SimpleCollectiviteCard} from 'ui/collectivites/SimpleCollectiviteCard';
import {SelectCollectiviteDialog} from './_AddDialog';
import {observer} from 'mobx-react-lite';
import {
  ownedCollectiviteBloc,
  OwnedCollectiviteBloc,
} from 'core-logic/observables/OwnedCollectiviteBloc';
import {Spacer} from 'ui/shared/Spacer';

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
                  collectivite={collectivite}
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
    <div className="app fr-container mt-5 flex justify-center">
      <section className="text-center">
        <MyCollectiviteCards bloc={ownedCollectiviteBloc} />

        <Spacer />
        <div className="my-4">
          Pourquoi pas un petit texte qui explique un peu.
        </div>
        <SelectCollectiviteDialog />
      </section>
    </div>
  );
};

export default CurrentUserCollectivites;
