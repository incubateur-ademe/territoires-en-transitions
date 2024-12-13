import { ActionDefinitionSummary } from '@/app/core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import { ActionReferentiel } from '@/app/types/action_referentiel';
import { addTargetToContentAnchors } from '@/app/utils/content';
import DOMPurify from 'dompurify';

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
