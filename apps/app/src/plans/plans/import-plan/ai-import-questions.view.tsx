'use client';

import { Event, useEventTracker } from '@tet/ui';
import { AiImportQuestionsForm } from './ai-import-questions.form';
import {
  answerTrackingProperties,
  type ImportQuestion,
} from './ai-import-questions.model';
import { useAnswerAiImportQuestion } from './data/use-answer-ai-import-question';

/**
 * Les précisions qu'attend un import, partout où elles se posent : l'envoi
 * des réponses et leur suivi ne s'écrivent qu'ici.
 */
export const AiImportQuestionsView = ({
  jobId,
  question,
  withSousActions,
  trackingProperties,
}: {
  jobId: string;
  question: ImportQuestion;
  withSousActions: boolean;
  /** D'où la question est posée : `origine`, `demarcheId`. */
  trackingProperties?: Record<string, unknown>;
}) => {
  const answer = useAnswerAiImportQuestion();
  const tracker = useEventTracker();

  return (
    <AiImportQuestionsForm
      key={jobId}
      doubts={question.doubts}
      withSousActions={withSousActions}
      isAnswering={answer.isPending}
      onSubmit={(choices) => {
        tracker(Event.plans.importIa.repondreQuestion, {
          ...trackingProperties,
          jobId,
          ...answerTrackingProperties(question.doubts, choices),
        });
        answer.mutate({ jobId, choices });
      }}
    />
  );
};
