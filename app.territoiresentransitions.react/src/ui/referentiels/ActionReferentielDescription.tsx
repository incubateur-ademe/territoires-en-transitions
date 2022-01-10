import type {ActionReferentiel} from 'generated/models/action_referentiel';
import {addTargetToContentAnchors} from 'utils/content';

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
