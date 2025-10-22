import { useGetCompletion } from '../data/use-get-completion';
import {
  COMPLETION_MESSAGES,
  CompletionFieldKey,
} from './completion-messages.config';

type CompletionAlertProps = {
  collectiviteId: number;
  planId: number;
};

export const CompletionAlert = ({
  collectiviteId,
  planId,
}: CompletionAlertProps) => {
  const fieldsToComplete = useGetCompletion(planId);

  if (fieldsToComplete.length === 0) {
    return null;
  }

  // We display the first field to complete (the most prioritized one)
  const firstField = fieldsToComplete[0];
  const messages = COMPLETION_MESSAGES[firstField.name as CompletionFieldKey];
  const buttonLink = messages.getButtonLink(collectiviteId, planId);

  return (
    <div>
      <h3>{messages.title}</h3>
      <p>{messages.subtitle(firstField.count)}</p>
      <p>{messages.description}</p>
      <a href={buttonLink}>
        <button>{messages.buttonLabel}</button>
      </a>
    </div>
  );
};
