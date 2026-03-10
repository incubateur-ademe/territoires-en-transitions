import { Select } from '@tet/ui';
import { ReactNode } from 'react';
import { QuestionReponseProps } from './question-reponse-props.types';

export const ReponseContainer = ({
  questionId,
  children,
  className,
}: {
  questionId: string;
  children: ReactNode;
  className?: string;
}) => (
  <div
    data-test={`reponse-${questionId}`}
    className={`flex pl-4 ${className ?? ''}`}
  >
    {children}
  </div>
);

/** Réponse donnant le choix entre plusieurs énoncés */
export const ReponseChoix = ({
  question,
  reponse,
  onChange,
  canEdit,
}: QuestionReponseProps) => {
  const { choix, id: questionId } = question;

  return (
    <ReponseContainer className="flex-col w-96" questionId={questionId}>
      <Select
        containerWidthMatchButton={true}
        options={
          choix?.map((c) => ({ label: c.formulation, value: c.id })) || []
        }
        values={reponse?.reponse as string}
        disabled={!canEdit}
        onChange={(value) => onChange(value || null)}
      />
    </ReponseContainer>
  );
};
