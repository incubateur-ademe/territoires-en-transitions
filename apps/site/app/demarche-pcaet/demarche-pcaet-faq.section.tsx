import {
  FAQ_CATEGORIES,
  FaqData,
  listFaqQuestions,
} from '@/site/app/faq/faq.data';
import { FAQ_TAB_DEMARCHE_PCAET } from '@/site/app/faq/faq.tabs';
import Markdown from '@/site/components/markdown/Markdown';
import Section from '@/site/components/sections/Section';
import { TitreSection } from '@/site/components/sections/TitreSection';
import { Accordion, Button } from '@tet/ui';
import { PCAET_HELP_URL } from './demarche-pcaet.data';

type FaqGroup = { titre: string | null; questions: FaqData[] };

/** Groupes dans l'ordre des catégories ; les questions sans catégorie à la fin, sans titre. */
const groupByCategorie = (questions: FaqData[]): FaqGroup[] => {
  const groups: FaqGroup[] = FAQ_CATEGORIES.map((categorie) => ({
    titre: categorie,
    questions: questions.filter((question) => question.categorie === categorie),
  }));
  groups.push({
    titre: null,
    questions: questions.filter((question) => !question.categorie),
  });
  return groups.filter((group) => group.questions.length > 0);
};

const FaqQuestions = ({ questions }: { questions: FaqData[] }) => (
  <div className="flex flex-col gap-4">
    {questions.map((question) => (
      <Accordion
        key={question.id}
        title={question.titre}
        content={<Markdown texte={question.contenu} className="px-8 pt-1" />}
        containerClassname="p-4 border bg-white rounded-xl"
        headerClassname="py-2 text-primary-10 font-medium"
      />
    ))}
  </div>
);

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
      <div className="flex flex-col gap-10 w-full max-w-3xl mx-auto">
        {groupByCategorie(questions).map((group) =>
          group.titre ? (
            <div key={group.titre} className="flex flex-col gap-4">
              <h3 className="mb-0 text-xl text-primary-9">{group.titre}</h3>
              <FaqQuestions questions={group.questions} />
            </div>
          ) : (
            <FaqQuestions key="sans-categorie" questions={group.questions} />
          )
        )}
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
