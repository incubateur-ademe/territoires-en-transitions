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
          linkTo={`/collectivite/${epci.siren}/plan_actions`}
          siren={epci.siren}
        />
        <div className="pb-3" />
        <SimpleEpciCardLink
          label="Référentiels"
          linkTo={`/collectivite/${epci.siren}/referentiels`}
          siren={epci.siren}
        />
        <div className="pb-3" />
        <SimpleEpciCardLink
          label="Indicateurs"
          linkTo={`/collectivite/${epci.siren}/indicateurs`}
          siren={epci.siren}
        />
      </div>
    </div>
  );
};
