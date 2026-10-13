import { appLabels } from '@/app/labels/catalog';
import { LevierId } from '@tet/domain/shared';
import { Survey, useSurveyResponse } from '@tet/ui';

const ACTION_SUGGESTION_SURVEY: Survey = {
  id: '01a13455-0443-0000-fa8f-93470b67e628',
  question: {
    id: '6f916808-c65f-47cd-b04a-37ee37d6cafe',
    question: appLabels.decrireLAction,
  },
};

export function useSendActionSuggestion() {
  const sendSurveyResponse = useSurveyResponse(ACTION_SUGGESTION_SURVEY);

  return (levierId: LevierId, description: string): void =>
    sendSurveyResponse(description, { levierId });
}
