import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { addTargetToContentAnchors } from '@/app/utils/content';
import DOMPurify from 'dompurify';

export const ActionDescriptionHtml = ({
  action,
  className,
}: {
  action: ActionDefinitionSummary;
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
