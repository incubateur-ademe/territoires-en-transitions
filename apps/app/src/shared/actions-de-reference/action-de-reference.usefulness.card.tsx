'use client';

import { appLabels } from '@/app/labels/catalog';
import { DetailedAction } from '@/app/ui/detailed-action/detailed-action.layout';
import { Button } from '@tet/ui';
import type { JSX, ReactNode } from 'react';
import { useState } from 'react';

const UsefulnessTitle = ({
  children,
}: {
  readonly children: ReactNode;
}): JSX.Element => (
  <p className="m-0 text-center text-base font-bold text-primary-9">
    {children}
  </p>
);

const UsefulnessQuestion = ({
  onAnswer,
}: {
  readonly onAnswer: (answer: UsefulnessAnswer) => void;
}): JSX.Element => (
  <>
    <UsefulnessTitle>
      {appLabels.actionDeReferenceUtileQuestion}
    </UsefulnessTitle>
    <div className="flex justify-center gap-4">
      <Button
        size="sm"
        variant="outlined"
        icon="thumb-up-line"
        onClick={() => onAnswer('+1')}
      >
        {appLabels.actionDeReferenceUtileOui}
      </Button>
      <Button
        size="sm"
        variant="outlined"
        icon="thumb-down-line"
        onClick={() => onAnswer('-1')}
      >
        {appLabels.actionDeReferenceUtileNon}
      </Button>
    </div>
  </>
);

export const ActionDeReferenceUsefulnessCard = ({
  onAnswer,
}: {
  readonly onAnswer: (answer: UsefulnessAnswer) => void;
}): JSX.Element => {
  const [hasAnswered, setHasAnswered] = useState(false);

  const answerQuestion = (answer: UsefulnessAnswer): void => {
    onAnswer(answer);
    setHasAnswered(true);
  };

  return (
    <DetailedAction.Section>
      <div className="flex flex-col items-center gap-4">
        {hasAnswered ? (
          <UsefulnessTitle>
            {appLabels.actionDeReferenceUtileMerci}
          </UsefulnessTitle>
        ) : (
          <UsefulnessQuestion onAnswer={answerQuestion} />
        )}
      </div>
    </DetailedAction.Section>
  );
};

export type UsefulnessAnswer = '+1' | '-1';
