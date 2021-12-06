import {makeEpciTabPath} from 'app/paths';
import {ElsesEpciRead, OwnedEpciRead} from 'generated/dataLayer';
import {Link} from 'react-router-dom';

const SimpleEpciCardLink = (props: {
  label: string;
  linkTo: string;
  siren: string;
}) => (
  <Link
    className="fr-btn fr-btn--secondary fr-btn--sm fr-fi-arrow-right-line fr-btn--icon-right w-full"
    to={props.linkTo}
  >
    {props.label}
  </Link>
);

export const SimpleEpciCard = ({
  epci,
}: {
  epci: ElsesEpciRead | OwnedEpciRead;
}) => {
  return (
    <div className="flex flex-col items-center justify-between p-8 bg-beige border-t-4">
      <h3 className="fr-h3 p-2 text-center ">{epci.nom}</h3>
      <div>
        <SimpleEpciCardLink
          label="Plan d'actions"
          linkTo={makeEpciTabPath({siren: epci.siren, tab: 'plans_actions'})}
          siren={epci.siren}
        />
        <div className="pb-3" />
        <SimpleEpciCardLink
          label="Référentiels"
          linkTo={makeEpciTabPath({siren: epci.siren, tab: 'referentiels'})}
          siren={epci.siren}
        />
        <div className="pb-3" />
        <SimpleEpciCardLink
          label="Indicateurs"
          linkTo={makeEpciTabPath({siren: epci.siren, tab: 'indicateurs'})}
          siren={epci.siren}
        />
      </div>
    </div>
  );
};
