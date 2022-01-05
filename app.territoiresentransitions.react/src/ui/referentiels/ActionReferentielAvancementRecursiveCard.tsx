import type {ActionReferentiel} from 'generated/models/action_referentiel';
import {ActionCommentaire, ActionExemplesExpandPanel} from 'ui/shared';
import {scoreBloc} from 'core-logic/observables/scoreBloc';
import {ActionStatusDropdown} from 'ui/shared/actions/ActionStatusDropdown';
import {ActionProgressBar} from 'ui/referentiels/ActionProgressBar';
import {ActionReferentielDisplayTitle} from 'ui/referentiels/ActionReferentielDisplayTitle';
import {ActionReferentielDescription} from 'ui/referentiels/ActionReferentielDescription';

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
  action: ActionReferentiel;
  card: ({action}: {action: ActionReferentiel}) => JSX.Element;
}) => {
  if (action.actions.length === 0) return <div> {card({action})}</div>;
  else
    return (
      <div>
        <div> {card({action})}</div>{' '}
        {action.actions.map(action => (
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
  action: ActionReferentiel;
}) => {
  const isLeaf = action.actions.length === 0;
  return (
    <div className="pt-8 flex flex-row justify-between">
      <div className="flex flex-col w-4/5">
        <ActionReferentielDisplayTitle action={action} />
        <ActionReferentielDescription action={action} />
        <ActionExemplesExpandPanel action={action} />
        <ActionCommentaire action={action} />
      </div>
      <div className="w-1/6 pl-4">
        <div className="w-full flex flex-col">
          {!isLeaf && (
            <ActionProgressBar action={action} scoreBloc={scoreBloc} />
          )}
          {isLeaf && <ActionStatusDropdown actionId={action.id} />}
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
  action: ActionReferentiel;
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
