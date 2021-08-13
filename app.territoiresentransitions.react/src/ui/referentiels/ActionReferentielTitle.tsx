import type { ActionReferentiel } from "generated/models/action_referentiel";

export const ActionReferentielTitle = ({
  action,
  className,
}: {
  action: ActionReferentiel;
  className?: string;
}) => (
  <span className={className ? className : `text-lg h-8`}>
    {action.id_nomenclature} - {action.nom}
  </span>
);
