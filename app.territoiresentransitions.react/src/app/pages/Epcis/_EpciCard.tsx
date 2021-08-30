import {Link} from 'react-router-dom';
import type {EpciStorable} from 'storables/EpciStorable';

const EpciCardLink = (props: {label: string; linkTo: string}) => (
  <Link
    className="fr-btn fr-btn--secondary fr-btn--sm fr-fi-arrow-right-line fr-btn--icon-right w-full"
    to={props.linkTo}
  >
    {props.label}
  </Link>
);

type EpciCardProps = {epci: EpciStorable};
export const EpciCard = ({epci}: EpciCardProps) => (
  <div className="flex flex-col items-center justify-between p-8 bg-beige">
    <h3 className="fr-h3 p-2 text-center ">{epci.nom}</h3>
    <div>
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
  </div>
);

export const OwnedEpciCard = ({epci}: EpciCardProps) => {
  return (
    <div className="relative">
      <EpciCard epci={epci} />
    </div>
  );
};
