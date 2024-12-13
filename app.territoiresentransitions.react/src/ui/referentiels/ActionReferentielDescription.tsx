import { ActionDefinitionSummary } from '@/app/core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import DOMPurify from 'dompurify';
import { ActionReferentiel } from 'types/action_referentiel';
import { addTargetToContentAnchors } from 'utils/content';

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
      __html: DOMPurify.sanitize(
        addTargetToContentAnchors(action.description ?? '')
      ),
    }}
  />
);
