'use client';

import { PersonnalisationQuestionReponse } from '@tet/domain/collectivites';
import { useSaveReponse } from './data/use-save-reponse';
import { QuestionReponse } from './question/question-reponse';

type Props = {
  canEdit: boolean;
  questionReponses: PersonnalisationQuestionReponse[];
};

export function PersonnalisationQuestionsList({
  canEdit,
  questionReponses,
}: Props) {
  const handleChange = useSaveReponse();

  const firstProportionIndex = questionReponses.findIndex(
    ({ question }) => question.type === 'proportion'
  );

  return (
    <div className="flex flex-col pt-2 pb-4 px-4 gap-4">
      {questionReponses.map(({ question, reponse }, index) => (
        <QuestionReponse
          key={question.id}
          question={question}
          reponse={reponse}
          canEdit={canEdit}
          onChange={(reponse) => handleChange(question, reponse)}
          hasProportionDescription={index === firstProportionIndex}
        />
      ))}
    </div>
  );
}
