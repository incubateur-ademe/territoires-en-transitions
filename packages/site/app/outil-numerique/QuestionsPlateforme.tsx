'use client';

import Markdown from '@components/markdown/Markdown';
import Section from '@components/sections/Section';
import {Accordion} from '@tet/ui';

type QuestionsPlateformeProps = {
  titre: string;
};

const QuestionsPlateforme = ({titre}: QuestionsPlateformeProps) => {
  return (
    <Section containerClassName="bg-primary-7">
      <h2 className="text-center text-white">{titre}</h2>
    </Section>
  );
};

export default QuestionsPlateforme;
