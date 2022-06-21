import {OwnedCollectiviteRead} from 'generated/dataLayer';
import {SimpleCollectiviteCard} from 'ui/collectivites/SimpleCollectiviteCard';
import {observer} from 'mobx-react-lite';
import {
  ownedCollectiviteBloc,
  OwnedCollectiviteBloc,
} from 'core-logic/observables/OwnedCollectiviteBloc';
import {Spacer} from 'ui/shared/Spacer';
import {AssocierCollectiviteDialog} from './AssocierCollectiviteDialog';
import {getReferentContacts} from 'core-logic/api/procedures/collectiviteProcedures';

const MaCollectiviteCard = observer(({bloc}: {bloc: OwnedCollectiviteBloc}) => {
  const ownedCollectiviteReads = bloc.ownedCollectiviteReads;

  return (
    !!ownedCollectiviteReads[0] && (
      <>
        <h2 className="fr-h2 py-5">Mes collectivités</h2>
        <div className="flex flex-wrap justify-center gap-12">
          {ownedCollectiviteReads.map((collectivite: OwnedCollectiviteRead) => (
            <SimpleCollectiviteCard
              key={collectivite.collectivite_id}
              collectivite={collectivite}
            />
          ))}
        </div>
      </>
    )
  );
});

export type TMesCollectivitesProps = {
  bloc?: OwnedCollectiviteBloc;
};

export const MesCollectivites = ({bloc}: TMesCollectivitesProps) => (
  <div
    data-test="CurrentUserCollectivites"
    className="app fr-container mt-5 flex justify-center"
  >
    <section className="text-center">
      <MaCollectiviteCard bloc={bloc || ownedCollectiviteBloc} />
      <Spacer />
      <AssocierCollectiviteDialog getReferentContacts={getReferentContacts} />
    </section>
  </div>
);

export default MesCollectivites;
