'use client';

import {Accordion} from '@tet/ui';
import {FaqData} from './page';
import Markdown from '@components/markdown/Markdown';

type ListeQuestionsProps = {
  questions: FaqData[];
};

const ListeQuestions = ({questions}: ListeQuestionsProps) => {
  return (
    <div className="flex flex-col gap-4">
      {questions.map(q => (
        <div key={q.id}>
          <Accordion
            id={q.id.toString()}
            title={q.titre}
            content={
              <Markdown
                texte={q.contenu}
                className="px-10 pt-6 border border-t-0 border-grey-4 rounded-b-lg"
              />
            }
          />
        </div>
      ))}
    </div>
  );
};

export default ListeQuestions;
