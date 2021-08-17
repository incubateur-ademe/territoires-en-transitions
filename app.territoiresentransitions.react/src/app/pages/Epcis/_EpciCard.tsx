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
  <div className="flex flex-col items-center pt-8 pr-6 pb-6">
    <h3 className="fr-h3 mb-6">{epci.nom}</h3>
    <EpciCardLink label="Plan d'actions" linkTo={`${epci.id}/fiches`} />
    <EpciCardLink
      label="Référentiels"
      linkTo={`${epci.id}/actions_referentiels`}
    />
    <EpciCardLink label="Indicateurs" linkTo={`${epci.id}/indicateurs`} />
  </div>
);
