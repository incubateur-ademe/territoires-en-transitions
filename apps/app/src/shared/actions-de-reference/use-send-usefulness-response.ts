import { appLabels } from '@/app/labels/catalog';
import type { ActionDeReferenceId } from '@tet/domain/shared';
import { type Survey, useSurveyResponse } from '@tet/ui';
import type { UsefulnessAnswer } from './action-de-reference.usefulness.card';

const USEFULNESS_SURVEY: Survey = {
  id: '01a1357e-3d34-0000-95d1-b7a955116d3b',
  question: {
    id: '3abbccbb-b052-4f04-8679-6480867d1cad',
    question: appLabels.actionDeReferenceUtileQuestion,
  },
};

type SendUsefulnessResponse = (answer: UsefulnessAnswer) => void;

export const useSendUsefulnessResponse = (
  actionDeReferenceId: ActionDeReferenceId
): SendUsefulnessResponse => {
  const sendSurveyResponse = useSurveyResponse(USEFULNESS_SURVEY);

  return (answer) => sendSurveyResponse(answer, { actionDeReferenceId });
};
