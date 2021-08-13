import {
  ActionDescription,
  ActionCommentaire,
  AddFicheActionButton,
  ActionStatusRadio,
} from "ui/shared";
import type { ActionReferentiel } from "generated/models/action_referentiel";
import { ProgressStat } from ".";

const ActionReferentielRecursiveCard = ({
  action,
  card,
  marginLeft,
}: {
  action: ActionReferentiel;
  card: ({ action }: { action: ActionReferentiel }) => JSX.Element;
  marginLeft?: number;
}) => {
  const ml = marginLeft ?? 0;
  if (action.actions.length === 0)
    return <div className={`ml-${ml}`}> {card({ action })}</div>;
  else
    return (
      <div>
        <div className={`ml-${ml}`}> {card({ action })}</div>{" "}
        {action.actions.map((action) => (
          <ActionReferentielRecursiveCard
            key={action.id}
            action={action}
            card={card}
            marginLeft={ml + 20}
          />
        ))}
      </div>
    );
};

const makeActionReferentielAvancementCard =
  ({ displayProgressStat }: { displayProgressStat: boolean }) =>
  ({ action }: { action: ActionReferentiel }) => {
    const isTache = action.actions.length === 0;
    return (
      <article
        className={` bg-beige my-8 p-4 border-bf500  ${
          isTache ? "" : "border-l-4"
        }`}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-normal">
            <span>{action.id_nomenclature} - </span>
            {action.nom}
          </h3>
          <ProgressStat
            action={action}
            position="right"
            className={`${displayProgressStat ? "" : "hidden"}`}
          />
        </div>
        <div className="flex justify-between my-6">
          {" "}
          <AddFicheActionButton />
          <div className={` ${!isTache ? "hidden" : ""}`}>
            <ActionStatusRadio actionId={action.id} />
          </div>
        </div>
        <div className="w-1/2">
          <ActionDescription content={action.description} />
          <ActionCommentaire actionId={action.id} />
        </div>
      </article>
    );
  };

export const ActionReferentielAvancementRecusiveCard = ({
  action,
  displayProgressStat,
}: {
  action: ActionReferentiel;
  displayProgressStat: boolean;
}) =>
  ActionReferentielRecursiveCard({
    action,
    card: makeActionReferentielAvancementCard({ displayProgressStat }),
  });
