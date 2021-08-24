import {Link} from 'react-router-dom';
import type {EpciStorable} from 'storables/EpciStorable';

const EpciCardLink = (props: {label: string; linkTo: string}) => (
  <Link
    className="fr-btn fr-btn--secondary fr-btn--sm fr-fi-arrow-right-line fr-btn--icon-right"
    to={props.linkTo}
  >
    {props.label}
  </Link>
);

type EpciCardProps = {epci: EpciStorable};
export const EpciCard = ({epci}: EpciCardProps) => (
  <div className="flex flex-col items-center pt-4 pr-6 pb-10 bg-beige border-bf500 border-t-4">
    <h3 className="fr-h3 pb-6 text-center ">{epci.nom}</h3>

    <EpciCardLink
      label="Plan d'actions"
      linkTo={`/collectivite/${epci.id}/plan_actions`}
    />
    <div className="pb-3" />
    <EpciCardLink
      label="Référentiels"
      linkTo={`/collectivite/${epci.id}/referentiels`}
    />
    <div className="pb-3" />
    <EpciCardLink
      label="Indicateurs"
      linkTo={`/collectivite/${epci.id}/indicateurs`}
    />
  </div>
);

export const OwnedEpciCard = ({epci}: EpciCardProps) => {
  return (
    <div className="relative">
      <span className="bg-yellow-400 absolute top-0 right-0 p-3"> ❌</span>
      <EpciCard epci={epci} />
    </div>
  );
};
