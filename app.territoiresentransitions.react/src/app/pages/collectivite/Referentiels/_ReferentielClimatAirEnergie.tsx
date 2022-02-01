import * as R from 'ramda';
import 'app/pages/collectivite/Referentiels/ArrowExpandable.css';
import {ExpandableAction} from 'ui/shared/actions/ExpandableAction';
import {compareIndexes} from 'utils/compareIndexes';
import {ActionReferentiel} from 'types/action_referentiel';

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
        <ExpandableAction action={axis} key={axis.id} />
      ))}
    </section>
  );
};
