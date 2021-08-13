import { actions as referentielActions } from "generated/data/referentiels";
import { Link } from "react-router-dom";
import {
  ActionReferentielAvancementRecusiveCard,
  ActionReferentielTitle,
  ProgressStat,
} from "ui/referentiels";
import { searchById } from "./searchById";
import "app/DesignSystem/buttons.css";
import { ActionDescription, AddFicheActionButton } from "ui/shared";

export const ActionReferentielAvancement = ({
  actionId,
}: {
  actionId: string;
}) => {
  const action = searchById(referentielActions, actionId);
  if (!action) {
    return <Link to="./actions_referentiels"></Link>;
  }
  return (
    <div>
      <div className="mt-8 mb-16">
        <div className="pt-8 flex justify-between items-center">
          <ActionReferentielTitle
            className="fr-h1 w-5/6 text-gray-900"
            action={action}
          />
          <AddFicheActionButton />
        </div>
        <ProgressStat
          action={action}
          position="left"
          className="w-full mb-10"
        />

        <ActionDescription content={action.description} width="2/3" />
      </div>

      <div>
        <h2 className="fr-h2"> Les actions</h2>
        {action.actions.map((action) => (
          <ActionReferentielAvancementRecusiveCard
            action={action}
            key={action.id}
          />
        ))}
      </div>
    </div>
  );
};
