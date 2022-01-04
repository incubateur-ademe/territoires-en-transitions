import {ActionReferentiel} from 'generated/models/action_referentiel';
import {useState} from 'react';
import {LazyDetails} from 'ui/shared/LazyDetails';
import {
  ActionReferentielTitle,
  ActionReferentielTitleCard,
  ActionProgressBar,
} from 'ui/referentiels';
import {Chevron} from 'ui/shared/Chevron';
import {scoreBloc} from 'core-logic/observables/scoreBloc';

/**
 * An expandable action used for "axes" and "orientations, shows Scores.
 *
 * Note: could be made recursive to simplify display on "axes" pages.
 */
export const ExpandableAction = ({action}: {action: ActionReferentiel}) => {
  const [opened, setOpened] = useState(false);
  return (
    <div className="mt-2">
      <LazyDetails
        summary={
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center w-full">
              <div className="px-3 w-1/12 ">
                <ActionProgressBar
                  action={action}
                  size="xs"
                  scoreBloc={scoreBloc}
                />
              </div>
              <div className="flex items-center mr-6">
                <ActionReferentielTitle
                  action={action}
                  className="fr-h6 mb-0 -mt-3"
                />
              </div>
              <Chevron direction={opened ? 'down' : 'left'} />
            </div>
          </div>
        }
        onChange={setOpened}
      >
        <div className=" ml-8 mb-6">
          {action.actions.map(action => (
            <ActionReferentielTitleCard key={action.id} action={action} />
          ))}
        </div>
      </LazyDetails>
    </div>
  );
};
