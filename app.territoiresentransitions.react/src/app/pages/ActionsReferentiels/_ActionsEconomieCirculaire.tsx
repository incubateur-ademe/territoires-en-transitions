import type { ActionReferentiel } from "generated/models/action_referentiel";

type ActionsEconomieCirculaireProps = {
  actions: ActionReferentiel[];
};

type ActionsByAxe = {
  axe: ActionReferentiel;
  actions: ActionReferentiel[];
  level: 1 | 2;
};

const actionsToActionsByAxe = (
  actions: ActionReferentiel[],
  level: 1 | 2,
): ActionsByAxe[] =>
  actions.map((action) => ({
    level: level,
    actions: action.actions,
    axe: action,
  }));

const getECIActionsByAxes = (actions: ActionReferentiel[]): ActionsByAxe[] => {
  // Filter action based on prefix
  const ECIActions = actions.filter((action) =>
    action.id.startsWith("economie_circulaire"),
  );

  // First axis actions
  const FirstAxisECIActions = actionsToActionsByAxe(ECIActions, 1);

  // const SecondAxisECIActions = ECIActions.reduce(
  //   (acc, action) => [...acc, ...actionsToActionsByAxe(action.actions, 2)],
  //   [] as ActionsByAxe[],
  // );
  return FirstAxisECIActions;

  // const actionsByAxes = new Map<ActionReferentiel, ActionReferentiel[]>();
  // const orientations: ActionReferentiel[] = [];
  // const axes: ActionReferentiel[] = [];

  // for (const action of actions) {
  //   for (const level1 of action.actions) {
  //     axes.push(level1);
  //     for (const level2 of level1.actions) {
  //       orientations.push(level2);
  //     }
  //   }
  // }

  // for (const parent of axes) {
  //   const actions = orientations.filter(
  //     (action) =>
  //       action.id.startsWith(parent.id) &&
  //       action.id.startsWith("economie_circulaire"),
  //   );
  //   if (actions.length) actionsByAxes.set(parent, actions);
  // }
  // return actionsByAxes;
};

export const ActionsEconomieCirculaire = ({
  actions,
}: ActionsEconomieCirculaireProps) => {
  const actionsByAxes = getECIActionsByAxes(actions);
  return (
    <div>
      {actionsByAxes.map((actionsByAxe) => (
        <div>
          <h2 className="fr-h2">
            {actionsByAxe.axe.id_nomenclature} {actionsByAxe.axe.nom}
          </h2>
          {/* <div>Axe : {actionsByAxe.axe.id}</div>
          <div>Actions : {actionsByAxe.actions.length}</div> */}
          {actionsByAxe.actions.map((action) => (
            <ActionReferentielCard action={action} />
          ))}
        </div>
      ))}
    </div>
  );
};

type ActionGenericDescriptionProps = { description: string };

const ActionGenericDescription = ({
  description,
}: ActionGenericDescriptionProps) => {
  if (description) return;
};

type ActionReferentielCardProps = { action: ActionReferentiel };

const ActionReferentielCard = ({ action }: ActionReferentielCardProps) => {
  if (action.actions.length === 0)
    return (
      <article className="bg-yellow-50">
        <h3>
          <span>{action.id_nomenclature} - </span>
          {action.nom}
        </h3>
        <h4> Description </h4>
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
