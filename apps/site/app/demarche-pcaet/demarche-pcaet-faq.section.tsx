import { listFaqQuestions } from '@/site/app/faq/faq.data';
import { FAQ_TAB_DEMARCHE_PCAET } from '@/site/app/faq/faq.tabs';
import Markdown from '@/site/components/markdown/Markdown';
import Section from '@/site/components/sections/Section';
import { TitreSection } from '@/site/components/sections/TitreSection';
import { Accordion, Button } from '@tet/ui';
import { PCAET_HELP_URL } from './demarche-pcaet.data';

/** Les questions de l'onglet « Démarche PCAET » de la FAQ, gérées dans Strapi. */
export const DemarchePcaetFAQSection = async () => {
  const questions = await listFaqQuestions(FAQ_TAB_DEMARCHE_PCAET);
  if (questions.length === 0) {
    return null;
  }

  return (
    <Section
      containerClassName="bg-primary-1 border-y border-primary-3"
      className="items-center"
    >
      <TitreSection>Questions fréquentes sur le dépôt PCAET</TitreSection>
      <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto">
        {questions.map((question) => (
          <Accordion
            key={question.id}
            title={question.titre}
            content={
              <Markdown texte={question.contenu} className="px-8 pt-4" />
            }
            containerClassname="p-4 border bg-white rounded-xl"
            headerClassname="py-2 text-primary-10 font-medium"
          />
        ))}
      </div>
      <Button
        variant="underlined"
        href={PCAET_HELP_URL}
        external
        className="after:hidden mt-4"
      >
        Voir toute l&apos;aide sur la démarche PCAET
      </Button>
    </Section>
  );
};
