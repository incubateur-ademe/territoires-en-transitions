import {useState} from 'react';
import {LazyDetails} from 'ui/shared/LazyDetails';
import {ActionReferentielDisplayTitle} from 'ui/referentiels/ActionReferentielDisplayTitle';
import {Chevron} from 'ui/shared/Chevron';
import {ActionReferentielLinkCard} from 'ui/referentiels/ActionReferentielLinkCard';
import ActionProgressBar from 'ui/referentiels/ActionProgressBar';
import {useActionSummaryChildren} from 'core-logic/hooks/referentiel';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';

/**
 * An expandable action used for "axes" and "sous axes", shows Scores.
 *
 * Note: could be made recursive to simplify display on "axes" pages.
 */
export const ExpandableAction = ({
  action,
}: {
  action: ActionDefinitionSummary;
}) => {
  const [opened, setOpened] = useState(false);
  const children = useActionSummaryChildren(action as ActionDefinitionSummary);

  return (
    <div className="mt-5" data-test={`ExpandableAction-${action.identifiant}`}>
      <LazyDetails
        summary={
          <div className="flex flex-row items-center justify-between mt-3">
            <div className="flex flex-row w-4/5 items-center">
              <ActionReferentielDisplayTitle action={action} />
              <div className="pt-1 pl-2">
                <Chevron direction={opened ? 'down' : 'left'} />
              </div>
            </div>
            <div className="w-1/6">
              <ActionProgressBar actionId={action.id} />
            </div>
          </div>
        }
        onChange={setOpened}
      >
        {children.map(action => {
          if (action.type === 'axe' || action.type === 'sous-axe') {
            return <ExpandableAction key={action.id} action={action} />;
          }
          return <ActionReferentielLinkCard key={action.id} action={action} />;
        })}
      </LazyDetails>
    </div>
  );
};
