'use client';

import { PersonnalisationQuestionReponse } from '@tet/domain/collectivites';
import { useSetPersonnalisationReponse } from './data/use-set-personnalisation-reponse';
import { QuestionReponse } from './question/question-reponse';

type Props = {
  canEdit: boolean;
  questionReponses: PersonnalisationQuestionReponse[];
};

export function PersonnalisationQuestionsList({
  canEdit,
  questionReponses,
}: Props) {
  const handleChange = useSetPersonnalisationReponse();

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
