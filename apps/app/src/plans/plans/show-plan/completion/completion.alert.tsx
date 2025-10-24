import { PictoPanierActions } from '@/app/ui/pictogrammes/PictoPanierActions';
import { Button } from '@/ui';
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
  const fieldsToComplete = useGetPlanCompletion(planId);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleClose = () => {
    setIsDismissed(true);
  };

  if (fieldsToComplete.length === 0 || isDismissed) {
    return null;
  }

  // We display the first field to complete (the most prioritized one)
  const firstField = fieldsToComplete[0];
  const messages = COMPLETION_MESSAGES[firstField.name];
  const buttonLink = messages.getButtonLink(collectiviteId, planId);

  return (
    <div className="bg-primary-7 rounded-xl shadow-lg p-6">
      <div className="flex items-start gap-4">
        <div className="flex items-center">
          <PictoPanierActions className="w-48 h-48" color="#FFFFFF" />
          <div className="flex-1 min-w-0 ml-8">
            <h3 className="text-white font-bold text-xl mb-4">
              {messages.title}
            </h3>
            <p className="mb-1 text-secondary-2 font-bold">
              {messages.subtitle(firstField.count)}
            </p>
            <p className="text-white text-lg mb-4">{messages.description}</p>

            <a href={buttonLink}>
              <button className="bg-white text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm">
                {messages.buttonLabel}
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
  );
};
