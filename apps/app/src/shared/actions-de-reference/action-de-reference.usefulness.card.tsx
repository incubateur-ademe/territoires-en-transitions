'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button, Card } from '@tet/ui';
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
        variant="outlined"
        icon="thumb-up-line"
        onClick={() => onAnswer('+1')}
      >
        {appLabels.actionDeReferenceUtileOui}
      </Button>
      <Button
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
    <Card className="items-center gap-4 p-6 font-normal shadow-none">
      {hasAnswered ? (
        <UsefulnessTitle>
          {appLabels.actionDeReferenceUtileMerci}
        </UsefulnessTitle>
      ) : (
        <UsefulnessQuestion onAnswer={answerQuestion} />
      )}
    </Card>
  );
};

export type UsefulnessAnswer = '+1' | '-1';
