import type { ActionReferentiel } from "generated/models/action_referentiel";
import { ProgressStat, ActionReferentielTitleCard } from "ui/referentiels";

const AxisSectionEconomieCirculaire = ({
  axis,
}: {
  axis: ActionReferentiel;
}) => (
  <div>
    <h2 className="fr-h2">
      {axis.id_nomenclature} {axis.nom}
    </h2>
    <ProgressStat action={axis} position="left" className="w-full" />
    <div className="h-16" />
    {axis.actions.map((action) => (
      <ActionReferentielTitleCard
        action={action}
        referentiel="eci"
        key={action.id}
      />
    ))}
  </div>
);

export const ReferentielEconomieCirculaire = ({
  eciAxes,
}: {
  eciAxes: ActionReferentiel[];
}) => {
  return (
    <section>
      {eciAxes.map((axis) => (
        <AxisSectionEconomieCirculaire axis={axis} key={axis.id} />
      ))}
    </section>
  );
};
