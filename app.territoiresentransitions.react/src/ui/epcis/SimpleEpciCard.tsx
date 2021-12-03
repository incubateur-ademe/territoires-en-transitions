import {ActiveEpciRead} from 'generated/dataLayer';
import {Link} from 'react-router-dom';

const SimpleEpciCardLink = (props: {
  label: string;
  linkTo: string;
  siren: string;
}) => (
  <Link
    className="fr-btn fr-btn--secondary fr-btn--sm fr-fi-arrow-right-line fr-btn--icon-right w-full"
    to={props.linkTo}
    onClick={() => {
      console.log('currentEpciBloc.change ', props.siren);
      currentEpciBloc.change({siren: props.siren});
    }}
  >
    {props.label}
  </Link>
);

type SimpleEpciCardProps = {epci: ActiveEpciRead};
export const SimpleEpciCard = ({epci}: SimpleEpciCardProps) => (
  <div className="flex flex-col items-center justify-between p-8 bg-beige">
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
