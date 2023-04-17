import {ActionStatusDropdown} from 'ui/referentiels/ActionStatusDropdown';
import ActionProgressBar from 'ui/referentiels/ActionProgressBar';
import {ActionReferentielDisplayTitle} from 'ui/referentiels/ActionReferentielDisplayTitle';
import {ActionReferentielDescription} from 'ui/referentiels/ActionReferentielDescription';
import {Spacer} from 'ui/shared/Spacer';
import {
  ActionExemplesExpandPanel,
  ActionPreuvesExpandPanel,
} from 'ui/shared/actions/ActionExpandPanels';
import {ActionCommentaire} from 'ui/shared/actions/ActionCommentaire';
import {useActionSummaryChildren} from 'core-logic/hooks/referentiel';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {PersoPotentiel} from 'app/pages/collectivite/PersoPotentielModal/PersoPotentiel';
import {useScrollIntoView} from 'utils/useScrollIntoView';

/**
 * Displays an actions and it's children below.
 */
const ActionReferentielRecursiveCard = ({
  action,
  card,
}: {
  action: ActionDefinitionSummary;
  card: ({action}: {action: ActionDefinitionSummary}) => JSX.Element;
}) => {
  const myRef = useScrollIntoView(action.id);
  const children = useActionSummaryChildren(action);

  return (
    <div id={action.id} ref={myRef}>
      {card({action})}
      {children.map(subaction => (
        <ActionReferentielRecursiveCard
          key={subaction.id}
          action={subaction}
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
  const myRef = useScrollIntoView(action.id);
  const isSubAction = action.type === 'sous-action';

  return (
    <div
      id={action.type === 'tache' ? action.id : undefined}
      className="pt-8 flex flex-row justify-between"
      ref={myRef}
    >
      <div className="flex flex-col w-4/5">
        <ActionReferentielDisplayTitle action={action} />
        <Spacer size={1} />
        <ActionReferentielDescription action={action} />
        {action.have_questions && <PersoPotentiel actionDef={action} />}
        {action.have_exemples && <ActionExemplesExpandPanel action={action} />}
        {isSubAction && <ActionPreuvesExpandPanel action={action} />}
        <ActionCommentaire action={action} />
      </div>
      <div className="w-2/8 pl-4">
        <div className="w-full flex flex-col">
          {!isLeaf && (
            <div className="pt-4">
              <ActionProgressBar actionId={action.id} />
            </div>
          )}
          {isLeaf && (
            <div
              className="pt-2 flex justify-end"
              data-test={`task-${action.id}`}
            >
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
