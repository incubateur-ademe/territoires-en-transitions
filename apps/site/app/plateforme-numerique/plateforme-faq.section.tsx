import Section from '@/site/components/sections/Section';
import { TitreSection } from '@/site/components/sections/TitreSection';
import { Accordion } from '@tet/ui';

const questions = [
  {
    question: "Comment créer un plan d'action ?",
    answer:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  },
  {
    question: 'Puis-je importer mes plans existants ?',
    answer:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  },
  {
    question: "Ai-je besoin d'une formation ?",
    answer:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  },
];

export const PlateformeFAQSection = async () => {
  return (
    <Section containerClassName="bg-primary-1 border-y border-primary-3">
      <TitreSection>Questions fréquentes</TitreSection>
      <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto">
        {questions.map((question) => (
          <Accordion
            key={question.question}
            title={question.question}
            content={question.answer}
            containerClassname="p-4 border bg-white rounded-xl"
            headerClassname="py-2 text-primary-10 font-medium"
            contentClassname="p-0 px-8"
          />
        ))}
      </div>
    </Section>
  );
};
