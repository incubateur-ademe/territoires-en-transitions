import { Link, useRouteMatch } from "react-router-dom";
import type { ActionReferentiel } from "generated/models/action_referentiel";
import { ProgressStat } from "ui/referentiels";
import { ActionDescription } from "ui/shared";
import { ActionReferentielTitle } from "./ActionReferentielTitle";

export const ActionReferentielTitleCard = ({
  action,
  referentielName,
}: {
  action: ActionReferentiel;
  referentielName: string;
}) => {
  const p = useRouteMatch();

  return (
    <article className="bg-white my-4">
      <Link to={`./action/${action.id}`} className="LinkedCardHeader">
        <div className="flex p-4 justify-between">
          <div>
            <span className="inline-block text-xs font-thin">
              {referentielName}
            </span>
          </div>
          <ProgressStat action={action} position="right" className="w-100" />
        </div>
        <div className="p-4 flex justify-between">
          <ActionReferentielTitle action={action} />
          <div className="fr-fi-arrow-right-line text-bf500"></div>
        </div>
      </Link>
      <div className="p-4">
        <ActionDescription content={action.description} />
      </div>
    </article>
  );
};
