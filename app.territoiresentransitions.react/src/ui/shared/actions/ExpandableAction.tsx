import {useState} from 'react';
import {LazyDetails} from 'ui/shared/LazyDetails';
import {ActionReferentielDisplayTitle} from 'ui/referentiels/ActionReferentielDisplayTitle';
import {Chevron} from 'ui/shared/Chevron';
import {scoreBloc} from 'core-logic/observables/scoreBloc';
import {ActionReferentielLinkCard} from 'ui/referentiels/ActionReferentielLinkCard';
import {ActionReferentiel} from 'types/action_referentiel';
import {ActionProgressBar} from 'ui/referentiels/ActionProgressBar';

/**
 * An expandable action used for "axes" and "sous axes", shows Scores.
 *
 * Note: could be made recursive to simplify display on "axes" pages.
 */
export const ExpandableAction = ({action}: {action: ActionReferentiel}) => {
  const [opened, setOpened] = useState(false);
  return (
    <div className="mt-5">
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
              <ActionProgressBar actionId={action.id} scoreBloc={scoreBloc} />
            </div>
          </div>
        }
        onChange={setOpened}
      >
        {action.actions.map(action => {
          if (action.type === 'domaine' || action.type === 'sous-domaine') {
            return <ExpandableAction key={action.id} action={action} />;
          }
          return <ActionReferentielLinkCard key={action.id} action={action} />;
        })}
      </LazyDetails>
    </div>
  );
};
