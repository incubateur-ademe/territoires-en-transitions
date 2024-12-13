import { ActionDefinitionSummary } from '@/app/core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import { ActionReferentiel } from '@/app/types/action_referentiel';
import DOMPurify from 'dompurify';
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
