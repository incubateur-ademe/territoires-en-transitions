'use client';

import Markdown from '@components/markdown/Markdown';
import Section from '@components/sections/Section';
import {Button} from '@tet/ui';

type QuestionsPlateformeProps = {
  titre: string;
  description?: string;
  cta_faq: string;
  cta_contact: string;
};

const QuestionsPlateforme = ({
  titre,
  description,
  cta_faq,
  cta_contact,
}: QuestionsPlateformeProps) => {
  return (
    <Section containerClassName="bg-primary-7">
      <h2 className="text-center text-white mb-1">{titre}</h2>

      {!!description && (
        <Markdown
          texte={description}
          className="text-white text-center lg:max-w-2xl mx-auto questions"
        />
      )}

      <div className="mx-auto flex max-lg:flex-col gap-8 justify-center items-center">
        <Button href="/faq?onglet=outil-numerique" variant="outlined">
          {cta_faq}
        </Button>
        <Button
          href="/contact"
          variant="outlined"
          className="!bg-[#FFE8BD] hover:!bg-[#FFE4A8]"
        >
          {cta_contact}
        </Button>
      </div>
    </Section>
  );
};

export default QuestionsPlateforme;
