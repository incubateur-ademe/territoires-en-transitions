import * as R from 'ramda';
import 'app/pages/collectivite/Referentiels/ArrowExpandable.css';
import {ExpandableAction} from 'ui/shared/actions/ExpandableAction';
import {ActionReferentielDisplayTitle} from 'ui/referentiels/ActionReferentielDisplayTitle';
import {compareIndexes} from 'utils/compareIndexes';
import {ActionReferentiel} from 'types/action_referentiel';

const AxisSectionClimatAirEnergie = ({axis}: {axis: ActionReferentiel}) => (
  <div className="flex flex-col justify-between  mb-8">
    <ActionReferentielDisplayTitle action={axis} />
    {axis.actions.map(subAxis => (
      <ExpandableAction action={subAxis} key={subAxis.id} />
    ))}
  </div>
);

export const ReferentielClimatAirEnergie = ({
  caeAxes,
}: {
  caeAxes: ActionReferentiel[];
}) => {
  const caeAxesSorted = R.sort(
    (a, b) => compareIndexes(a.id_nomenclature, b.id_nomenclature),
    caeAxes
  );

  return (
    <section>
      {caeAxesSorted.map(axis => (
        <AxisSectionClimatAirEnergie axis={axis} key={axis.id} />
      ))}
    </section>
  );
};
