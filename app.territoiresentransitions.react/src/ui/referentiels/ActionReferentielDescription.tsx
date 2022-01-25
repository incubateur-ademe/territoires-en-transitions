import {addTargetToContentAnchors} from 'utils/content';
import {ActionReferentiel} from 'types/action_referentiel';
import {ActionDefinitionSummary} from 'core-logic/api/procedures/referentielProcedures';

export const ActionReferentielDescription = ({
  action,
  className,
}: {
  action: ActionReferentiel | ActionDefinitionSummary;
  className?: string;
}) => (
  <div
    className={className ? className : 'htmlContent'}
    dangerouslySetInnerHTML={{
      __html: addTargetToContentAnchors(action.description ?? ''),
    }}
  />
);
