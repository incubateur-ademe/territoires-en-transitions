import type {ActionReferentiel} from 'generated/models/action_referentiel';
import * as R from 'ramda';
import {ActionReferentielTitle} from 'ui/referentiels';
import {compareIndexes} from 'utils';
import 'app/pages/collectivite/Referentiels/ArrowExpandable.css';
import {ExpandableAction} from 'ui/shared/actions/ExpandableAction';
import {CurrentEpciCompletionStar} from 'ui/referentiels/CurrentEpciCompletionStar';

const AxisSectionClimatAirEnergie = ({axis}: {axis: ActionReferentiel}) => (
  <div className="flex flex-col justify-between  mb-8">
    <div className="flex  gap-6">
      <ActionReferentielTitle action={axis} className="fr-h3" />
      <CurrentEpciCompletionStar action={axis} />
    </div>
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
