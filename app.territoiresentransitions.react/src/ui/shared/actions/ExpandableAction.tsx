import {ActionReferentiel} from 'generated/models/action_referentiel';
import {useState} from 'react';
import {LazyDetails} from 'ui/shared/LazyDetails';
import {
  ActionReferentielTitle,
  ActionReferentielTitleCard,
  CurrentEpciGaugeProgressStat,
} from 'ui/referentiels';
import {Chevron} from 'ui/shared/Chevron';
import {CurrentEpciCompletionStar} from 'ui/referentiels/CurrentEpciCompletionStar';

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
              <div className="flex gap-2 justify-start w-36">
                <div className="-mt-1">
                  <CurrentEpciCompletionStar
                    action={action}
                    tooltipPlacement="left"
                  />
                </div>
                <CurrentEpciGaugeProgressStat action={action} size="xs" />
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
