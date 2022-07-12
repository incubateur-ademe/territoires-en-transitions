import {MesCollectivitesRead} from 'generated/dataLayer';
import {useOwnedCollectivites} from 'core-logic/hooks/useOwnedCollectivites';
import {SimpleCollectiviteCard} from 'ui/collectivites/SimpleCollectiviteCard';
import {Spacer} from 'ui/shared/Spacer';
import {AssocierCollectiviteDialog} from './AssocierCollectiviteDialog';
import {getReferentContacts} from 'core-logic/api/procedures/collectiviteProcedures';

export type TMesCollectivitesProps = {
  ownedCollectivites: MesCollectivitesRead[] | null;
};

const MesCollectivitesCards = ({
  ownedCollectivites,
}: TMesCollectivitesProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-12">
      {ownedCollectivites?.map(collectivite => (
        <SimpleCollectiviteCard
          key={collectivite.collectivite_id}
          collectivite={collectivite}
        />
      ))}
    </div>
  );
};

export const MesCollectivites = ({
  ownedCollectivites,
}: TMesCollectivitesProps) => {
  return (
    <div
      data-test="CurrentUserCollectivites"
      className="app fr-container mt-5 flex justify-center"
    >
      <section className="text-center">
        <h2 className="fr-h2 py-5">Mes collectivités</h2>
        {ownedCollectivites?.length ? (
          <MesCollectivitesCards ownedCollectivites={ownedCollectivites} />
        ) : null}
        <Spacer />
        <AssocierCollectiviteDialog getReferentContacts={getReferentContacts} />
      </section>
    </div>
  );
};

export default () => {
  const ownedCollectivites = useOwnedCollectivites();
  return <MesCollectivites ownedCollectivites={ownedCollectivites} />;
};
