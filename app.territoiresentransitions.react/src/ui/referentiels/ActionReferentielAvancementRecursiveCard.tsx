import {scoreBloc} from 'core-logic/observables/scoreBloc';
import {ActionStatusDropdown} from 'ui/shared/actions/ActionStatusDropdown';
import {ActionProgressBar} from 'ui/referentiels/ActionProgressBar';
import {ActionReferentielDisplayTitle} from 'ui/referentiels/ActionReferentielDisplayTitle';
import {ActionReferentielDescription} from 'ui/referentiels/ActionReferentielDescription';
import {Spacer} from 'ui/shared/Spacer';
import {ActionExemplesExpandPanel} from 'ui/shared/actions/ActionExpandPanels';
import {ActionCommentaire} from 'ui/shared/actions/ActionCommentaire';
import {ActionReferentiel} from 'types/action_referentiel';
import {ActionDefinitionSummary} from 'core-logic/api/procedures/referentielProcedures';
import {useActionSummaryChildren} from 'core-logic/hooks/referentiel';

/**
 * Displays an actions and it's children indented below.
 *
 * @param action
 * @param card
 * @param marginLeft the accumulated margin passed down to children for
 * indentation, beware the resulting tailwind classes have to be excluded
 * from purge in `tailwind.config.js`.
 * @constructor
 */
const ActionReferentielRecursiveCard = ({
  action,
  card,
}: {
  action: ActionDefinitionSummary;
  card: ({action}: {action: ActionDefinitionSummary}) => JSX.Element;
}) => {
  if (action.children.length === 0) return <div> {card({action})}</div>;

  const children = useActionSummaryChildren(action);
  return (
    <div id={action.id}>
      <div> {card({action})}</div>{' '}
      {children.map(action => (
        <ActionReferentielRecursiveCard
          key={action.id}
          action={action}
          card={card}
        />
      ))}
    </div>
  );
};

export const ActionReferentielAvancementCard = ({
  action,
}: {
  displayProgressStat: boolean;
  displayAddFicheActionButton: boolean;
  action: ActionDefinitionSummary;
}) => {
  const isLeaf = action.children.length === 0;
  return (
    <div className="pt-8 flex flex-row justify-between">
      <div className="flex flex-col w-4/5">
        <ActionReferentielDisplayTitle action={action} />
        <Spacer size={1} />
        <ActionReferentielDescription action={action} />
        <ActionExemplesExpandPanel action={action} />
        <ActionCommentaire action={action} />
      </div>
      <div className="w-1/6 pl-4">
        <div className="w-full flex flex-col">
          {!isLeaf && (
            <div className="pt-4">
              <ActionProgressBar actionId={action.id} scoreBloc={scoreBloc} />
            </div>
          )}
          {isLeaf && (
            <div className="pt-2 flex justify-end">
              <ActionStatusDropdown actionId={action.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ActionReferentielAvancementRecursiveCard = ({
  action,
  displayProgressStat,
  displayAddFicheActionButton,
}: {
  action: ActionDefinitionSummary;
  displayProgressStat: boolean;
  displayAddFicheActionButton: boolean;
}) =>
  ActionReferentielRecursiveCard({
    action,
    card: ({action}) =>
      ActionReferentielAvancementCard({
        action,
        displayProgressStat,
        displayAddFicheActionButton,
      }),
  });
