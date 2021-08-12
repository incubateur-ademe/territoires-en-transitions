import type { ActionReferentiel } from "generated/models/action_referentiel";
import { ProgressStat, ActionReferentielTitleCard } from "ui/referentiels";

const EconomieCirculaireAxisSection = ({
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
        referentielName="Économie circulaire"
        key={action.id}
      />
    ))}
  </div>
);

export const EconomieCirculaireReferentiel = ({
  actions,
}: {
  actions: ActionReferentiel[];
}) => {
  const eciReferentiel = actions.find(
    (action) => action.id === "economie_circulaire",
  );
  const eciAxes = eciReferentiel ? eciReferentiel.actions : [];

  return (
    <section>
      {eciAxes.map((axis) => (
        <EconomieCirculaireAxisSection axis={axis} key={axis.id} />
      ))}
    </section>
  );
};
