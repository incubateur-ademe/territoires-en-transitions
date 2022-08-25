import {ActionStatusDropdown} from 'ui/shared/actions/ActionStatusDropdown';
import ActionProgressBar from 'ui/referentiels/ActionProgressBar';
import {ActionReferentielDisplayTitle} from 'ui/referentiels/ActionReferentielDisplayTitle';
import {ActionReferentielDescription} from 'ui/referentiels/ActionReferentielDescription';
import {Spacer} from 'ui/shared/Spacer';
import {ActionExemplesExpandPanel} from 'ui/shared/actions/ActionExpandPanels';
import {ActionCommentaire} from 'ui/shared/actions/ActionCommentaire';
import {useActionSummaryChildren} from 'core-logic/hooks/referentiel';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {PersoPotentiel} from 'app/pages/collectivite/PersoPotentielModal/PersoPotentiel';
import {useEffect, useRef} from 'react';
import {useLocation} from 'react-router-dom';

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

  if (action.children.length === 0) return <div> {card({action})}</div>;

  const children = useActionSummaryChildren(action);
  return (
    <div id={action.id} ref={myRef}>
      <div> {card({action})}</div>{' '}
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

  return (
    <div className="pt-8 flex flex-row justify-between" ref={myRef}>
      <div className="flex flex-col w-4/5">
        <ActionReferentielDisplayTitle action={action} />
        <Spacer size={1} />
        <ActionReferentielDescription action={action} />
        {action.have_questions && <PersoPotentiel actionDef={action} />}
        {action.have_exemples && <ActionExemplesExpandPanel action={action} />}
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

// on utilise scrollIntoView car la navigation classique (ajout d'un id sur un élément) vers les ancres semble ne pas fonctionner correctement...
const useScrollIntoView = (anchor: string) => {
  const myRef = useRef<null | HTMLDivElement>(null);
  const location = useLocation();
  useEffect(() => {
    // applique l'effet si l'url contient l'ancre voulue (et que la ref sur l'elt est créée)
    if (myRef && location.hash.substring(1).split('&').includes(anchor)) {
      // le timeout permet que le render soit terminé avant de scroller vers l'élément
      setTimeout(() => {
        myRef?.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 0);
    }
  }, [myRef, location.hash]);
  return myRef;
};
