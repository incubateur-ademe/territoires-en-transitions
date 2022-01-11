import {addTargetToContentAnchors} from 'utils/content';
import {ActionReferentiel} from 'types/action_referentiel';

export const ActionReferentielDescription = ({
  action,
  className,
}: {
  action: ActionReferentiel;
  className?: string;
}) => (
  <div
    className={className ? className : 'htmlContent'}
    dangerouslySetInnerHTML={{
      __html: addTargetToContentAnchors(action.description ?? ''),
    }}
  />
);
