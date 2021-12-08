import {makeCollectiviteTabPath} from 'app/paths';
import {
  ElsesCollectiviteRead,
  OwnedCollectiviteRead,
} from 'generated/dataLayer';
import {Link} from 'react-router-dom';

const SimpleCollectiviteCardLink = (props: {
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
    <div className="flex flex-col items-center justify-between p-8 bg-beige border-t-4">
      <h3 className="fr-h3 p-2 text-center ">{collectivite.nom}</h3>
      <div>
        <SimpleCollectiviteCardLink
          label="Plan d'actions"
          linkTo={makeCollectiviteTabPath({
            id: collectivite.id,
            tab: 'plans_actions',
          })}
          id={collectivite.id}
        />
        <div className="pb-3" />
        <SimpleCollectiviteCardLink
          label="Référentiels"
          linkTo={makeCollectiviteTabPath({
            id: collectivite.id,
            tab: 'referentiels',
          })}
          id={collectivite.id}
        />
        <div className="pb-3" />
        <SimpleCollectiviteCardLink
          label="Indicateurs"
          linkTo={makeCollectiviteTabPath({
            id: collectivite.id,
            tab: 'indicateurs',
          })}
          id={collectivite.id}
        />
      </div>
    </div>
  );
};
