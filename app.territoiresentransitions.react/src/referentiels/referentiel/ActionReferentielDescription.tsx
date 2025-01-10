import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { ActionReferentiel } from '@/app/referentiels/referentiels.types';
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
