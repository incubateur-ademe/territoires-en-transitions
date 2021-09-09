import type {EpciStorable} from 'storables/EpciStorable';
import {Link} from 'react-router-dom';
import {caeAxes, eciAxes} from 'utils/referentiels';
import {epciCard_AxisShortLabel} from 'app/labels';
import {
  EconomieCirculaireRootProgressStat,
  GaugeProgressStat,
} from 'ui/referentiels';
import {ActionReferentiel} from 'generated/models/action_referentiel';

const DetailedEpciCardPropsLink = (props: {label: string; linkTo: string}) => (
  <Link to={props.linkTo}>
    <div className="flex flex-wrap text-sm text-bf500">
      {props.label}
      <div className="fr-fi-arrow-right-line fr-btn--icon-left pl-4"> </div>
    </div>
  </Link>
);

const DetailedPlanActions = ({epci}: DetailedEpciCardProps) => (
  <div>
    {' '}
    <div>Plan d'actions</div>{' '}
    <DetailedEpciCardPropsLink
      label="Voir"
      linkTo={`/collectivite/${epci.id}/plan_actions`} // TODO link to specific plan d'action
    />
  </div>
);

const AxisSummary = (props: {axis: ActionReferentiel; epciId: string}) => (
  <div className="flex items-center justify-between text-xs">
    <div className="w-1/2">
      {epciCard_AxisShortLabel[props.axis.id] ??
        `${props.axis.id_nomenclature} - ${props.axis.nom}`}
    </div>
    <div className="flex">
      <GaugeProgressStat action={props.axis} />
      <DetailedEpciCardPropsLink
        label=""
        linkTo={`/collectivite/${props.epciId}/referentiels`} // TODO link to ECI ref
      />
    </div>
  </div>
);

const DetailedECIReferentiel = ({epci}: DetailedEpciCardProps) => (
  <div>
    <div className="flex justify-between items-center">
      <div className="text-lg font-bold">Economie Circulaire</div>
      <EconomieCirculaireRootProgressStat />
    </div>
    {eciAxes.map(axis => (
      <div className="my-1">
        <AxisSummary axis={axis} epciId={epci.id} />
      </div>
    ))}
    <DetailedEpciCardPropsLink
      label="Voir le référentiel"
      linkTo={`/collectivite/${epci.id}/referentiels`} // TODO link to ECI ref
    />
  </div>
);
const DetailedCAEReferentiel = ({epci}: DetailedEpciCardProps) => (
  <div>
    <div className="text-lg font-bold">Climat Air Energie</div>
    {caeAxes.map(axis => (
      <div className="my-1">
        <AxisSummary axis={axis} epciId={epci.id} />
      </div>
    ))}
    <DetailedEpciCardPropsLink
      label="Voir le référentiel"
      linkTo={`/collectivite/${epci.id}/referentiels`} // TODO link to CAE ref
    />
  </div>
);

type DetailedEpciCardProps = {epci: EpciStorable};
const DetailedEpciCard = ({epci}: DetailedEpciCardProps) => (
  <div className="flex flex-col items-center justify- p-8 bg-beige">
    <div className="flex items-center w-full justify-between">
      <div></div>
      <div>
        <h3 className="fr-h3 p-2 text-center ">{epci.nom}</h3>
      </div>
      <div>
        {' '}
        <DetailedEpciCardPropsLink
          label="Voir les indicateurs"
          linkTo={`/collectivite/${epci.id}/indicateurs`}
        />
      </div>
    </div>
    <div className="flex items-center w-full justify-between">
      <div className="w-1/3">
        <DetailedPlanActions epci={epci} />
      </div>
      <div className="w-1/3">
        <DetailedCAEReferentiel epci={epci} />
      </div>
      <div className="w-1/3">
        <DetailedECIReferentiel epci={epci} />
      </div>
    </div>
  </div>
);

export const OwnedEpciCard = ({epci}: DetailedEpciCardProps) => {
  return (
    <div className="py-2">
      <DetailedEpciCard epci={epci} />
    </div>
  );
};
