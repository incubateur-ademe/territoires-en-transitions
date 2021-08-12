import { ActionDescription } from "ui/shared";
import type { ActionReferentiel } from "generated/models/action_referentiel";

const ActionReferentielCard = ({ action }: { action: ActionReferentiel }) => {
  if (action.actions.length === 0)
    return (
      <article className="bg-yellow-50 ActionReferentielCard">
        <h3>
          <span>{action.id_nomenclature} - </span>
          {action.nom}
        </h3>
        <ActionDescription content={action.description} />
        <div
          dangerouslySetInnerHTML={{
            __html: action.description,
          }}
        ></div>
      </article>
    );
  else
    return (
      <div>
        {" "}
        {action.actions.map((action) => (
          <ActionReferentielCard action={action} />
        ))}
      </div>
    );
};
