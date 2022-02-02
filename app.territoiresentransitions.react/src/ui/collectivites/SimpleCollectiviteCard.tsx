import {
  makeCollectiviteDefaultPlanActionUrl,
  makeCollectiviteIndicateursUrl,
  makeCollectiviteReferentielUrl,
  makeCollectiviteTableauBordUrl,
} from 'app/paths';
import {
  ElsesCollectiviteRead,
  OwnedCollectiviteRead,
} from 'generated/dataLayer';
import {Link} from 'react-router-dom';

const SimpleCollectiviteCardPrimaryLink = (props: {
  label: string;
  linkTo: string;
  id: number;
}) => (
  <Link
    className="fr-btn fr-btn--primary fr-btn--sm fr-fi-arrow-right-line fr-btn--icon-right w-full"
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
    className="fr-btn fr-btn--secondary fr-btn--sm fr-fi-arrow-right-line fr-btn--icon-right w-full"
    to={props.linkTo}
  >
    {props.label}
  </Link>
);

export const SimpleCollectiviteCard = ({
  collectivite,
}: {
  collectivite: ElsesCollectiviteRead | OwnedCollectiviteRead;
}) => {
  return (
    <div className="w-80 flex flex-col items-center justify-between p-8 bg-beige border-t-4">
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
      </div>
    </div>
  );
};
