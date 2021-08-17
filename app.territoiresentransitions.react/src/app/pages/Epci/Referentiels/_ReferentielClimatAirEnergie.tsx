import type {ActionReferentiel} from 'generated/models/action_referentiel';
import * as R from 'ramda';
import {
  ActionReferentielTitle,
  ActionReferentielTitleCard,
} from 'ui/referentiels';
import {compareIndexes} from 'utils';
import 'app/pages/Epci/Referentiels/ArrowExpandable.css';

const SubAxisSectionClimatAirEnergie = ({
  subAxis,
}: {
  subAxis: ActionReferentiel;
}) => {
  return (
    <div className="mb-2 ml-4 ArrowExpandable">
      <details>
        <summary className="flex items-center">
          <div>
            <ActionReferentielTitle action={subAxis} className="fr-h3 mb-0" />
            <span
              className="fr-fi-arrow-right-s-line ml-10 text-xl"
              aria-hidden={true}
            ></span>
          </div>
        </summary>
        <div className="mt-8 ml-4 mb-6">
          {subAxis.actions.map(action => (
            <ActionReferentielTitleCard
              key={action.id}
              action={action}
              referentiel="cae"
            />
          ))}
        </div>
      </details>
    </div>
  );
};

const AxisSectionClimatAirEnergie = ({axis}: {axis: ActionReferentiel}) => (
  <div className="flex flex-col justify-between  mt-8">
    <ActionReferentielTitle action={axis} className="fr-h2" />
    {axis.actions.map(subAxis => (
      <SubAxisSectionClimatAirEnergie subAxis={subAxis} key={subAxis.id} />
    ))}

    {/* <div className="h-16" />
    {axis.actions.map((action) => (
      <ActionReferentielTitleCard
        action={action}
        referentielName="Climat Air Énergie"
        key={action.id}
      />
    ))} */}
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
