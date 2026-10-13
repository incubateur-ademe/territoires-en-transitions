import { Event } from './posthog-events';
import { useEventTracker } from './use-event-tracker';

export type SurveyQuestion = {
  id: string;
  question: string;
};

export type Survey = {
  id: string;
  question: SurveyQuestion;
};

export function useSurveyResponse(survey: Survey) {
  const tracker = useEventTracker();

  return (response: string, properties?: Record<string, unknown>): void =>
    tracker(Event.surveys.sent, {
      $survey_id: survey.id,
      $survey_questions: [survey.question],
      $survey_response: response,
      ...properties,
    });
}
