import { PictoPanierActions } from '@/app/ui/pictogrammes/PictoPanierActions';
import { useIsVisitor } from '@/app/users/authorizations/use-is-visitor';
import { Button, Spacer } from '@tet/ui';
import { useState } from 'react';
import { useGetPlanCompletion } from '../data/use-get-completion';
import { COMPLETION_MESSAGES } from './completion-messages.config';

type CompletionAlertProps = {
  collectiviteId: number;
  planId: number;
};

export const CompletionAlert = ({
  collectiviteId,
  planId,
}: CompletionAlertProps) => {
  const isVisitor = useIsVisitor();
  const fieldsToComplete = useGetPlanCompletion(planId);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleClose = () => {
    setIsDismissed(true);
  };

  const mostPrioritaryFieldToComplete = fieldsToComplete[0];

  if (mostPrioritaryFieldToComplete === undefined || isDismissed || isVisitor) {
    return null;
  }

  const { name, count } = mostPrioritaryFieldToComplete;
  const { title, subtitle, description, buttonLabel, getButtonLink } =
    COMPLETION_MESSAGES[name];

  return (
    <>
      <div className="bg-primary-7 rounded-xl shadow-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex items-center">
            <PictoPanierActions className="w-24 h-24" color="#FFFFFF" />
            <div className="flex-1 min-w-0 ml-8">
              <h3 className="text-white font-bold text-lg mb-4">{title}</h3>
              <p className="mb-1 text-secondary-2 font-bold text-sm">
                {subtitle(count)}
              </p>
              <p className="text-white text-sm mb-4">{description}</p>

              <a href={getButtonLink(collectiviteId, planId)}>
                <button className="bg-white text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm text-sm">
                  {buttonLabel}
                </button>
              </a>
            </div>
          </div>

          <Button
            dataTest="close-completion-alert"
            title="Fermer"
            onClick={handleClose}
            icon="close-line"
            variant="grey"
            size="xs"
            className="ml-auto !bg-primary-8 hover:!bg-primary-9 !text-white !border-none"
          />
        </div>
      </div>
      <Spacer height={2} />
    </>
  );
};
