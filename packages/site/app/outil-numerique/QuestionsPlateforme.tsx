'use client';

import Markdown from '@components/markdown/Markdown';
import Section from '@components/sections/Section';
import {Accordion} from '@tet/ui';

type QuestionsPlateformeProps = {
  titre: string;
  liste: {
    id: number;
    titre: string;
    contenu: string;
  }[];
};

const QuestionsPlateforme = ({titre, liste}: QuestionsPlateformeProps) => {
  return (
    <Section containerClassName="bg-primary-0">
      <h2 className="text-center">{titre}</h2>
      <div className="flex flex-col gap-2">
        {liste.map(l => (
          <div key={l.id}>
            <Accordion
              id={l.id.toString()}
              title={l.titre}
              content={
                <Markdown
                  texte={l.contenu}
                  className="px-10 pt-6 border border-t-0 border-grey-4 rounded-b-lg"
                />
              }
            />
          </div>
        ))}
      </div>
    </Section>
  );
};

export default QuestionsPlateforme;
