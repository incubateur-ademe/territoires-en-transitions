import {
  makeCollectiviteDefaultPlanActionUrl,
  makeCollectiviteIndicateursUrl,
  makeCollectiviteReferentielUrl,
  makeCollectiviteTableauBordUrl,
  makeCollectiviteUsersUrl,
} from 'app/paths';
import {useOwnedAsAgentCollectiviteIds} from 'core-logic/hooks/useOwnedCollectivites';
import {ElsesCollectiviteRead, MesCollectivitesRead} from 'generated/dataLayer';
import {Link} from 'react-router-dom';

const SimpleCollectiviteCardPrimaryLink = (props: {
  label: string;
  linkTo: string;
  id: number;
}) => (
  <Link
    className="fr-btn fr-btn--primary fr-btn--sm fr-fi-arrow-right-line fr-btn--icon-right w-full justify-between"
    to={props.linkTo}
  >
    {props.label}
  </Link>
);

const SimpleCollectiviteCardSecondaryLink = (props: {
  label: string;
  linkTo: string;
  id: number;
}) => (
  <Link
    className="fr-btn fr-btn--secondary fr-btn--sm fr-fi-arrow-right-line fr-btn--icon-right w-full justify-between"
    to={props.linkTo}
  >
    {props.label}
  </Link>
);

export const SimpleCollectiviteCard = ({
  collectivite,
}: {
  collectivite: ElsesCollectiviteRead | MesCollectivitesRead;
}) => {
  const ownedAsAgentCollectiviteIds = useOwnedAsAgentCollectiviteIds();

  return (
    <div
      data-test="SimpleCollectiviteCard"
      className="w-80 flex flex-col items-center justify-between p-8 bg-beige border-t-4"
    >
      <h3 className="fr-h3 p-2 text-center ">{collectivite.nom}</h3>
      <div className="flex flex-col gap-2">
        <SimpleCollectiviteCardPrimaryLink
          label="Tableau de bord"
          linkTo={makeCollectiviteTableauBordUrl({
            collectiviteId: collectivite.collectivite_id,
          })}
          id={collectivite.collectivite_id}
        />
        <SimpleCollectiviteCardSecondaryLink
          label="Plan d'action"
          linkTo={makeCollectiviteDefaultPlanActionUrl({
            collectiviteId: collectivite.collectivite_id,
          })}
          id={collectivite.collectivite_id}
        />
        <SimpleCollectiviteCardSecondaryLink
          label="Référentiels"
          linkTo={makeCollectiviteReferentielUrl({
            collectiviteId: collectivite.collectivite_id,
            referentielId: 'eci',
          })}
          id={collectivite.collectivite_id}
        />
        <SimpleCollectiviteCardSecondaryLink
          label="Indicateurs"
          linkTo={makeCollectiviteIndicateursUrl({
            collectiviteId: collectivite.collectivite_id,
            indicateurView: 'eci',
          })}
          id={collectivite.collectivite_id}
        />
        <div
          className={
            ownedAsAgentCollectiviteIds?.includes(collectivite.collectivite_id)
              ? ''
              : 'invisible'
          }
        >
          <SimpleCollectiviteCardSecondaryLink
            label="Paramètres"
            linkTo={makeCollectiviteUsersUrl({
              collectiviteId: collectivite.collectivite_id,
            })}
            id={collectivite.collectivite_id}
          />
        </div>
      </div>
    </div>
  );
};
