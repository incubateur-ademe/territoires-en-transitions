import type {ActionReferentiel} from 'generated/models/action_referentiel';
import * as R from 'ramda';
import {ActionReferentielTitle} from 'ui/referentiels';
import {compareIndexes} from 'utils';
import 'app/pages/collectivite/Referentiels/ArrowExpandable.css';
import React from 'react';
import {ExpandableAction} from 'ui/shared/actions/ExpandableAction';

const AxisSectionClimatAirEnergie = ({axis}: {axis: ActionReferentiel}) => (
  <div className="flex flex-col justify-between  mt-8">
    <ActionReferentielTitle action={axis} className="fr-h2" />
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
