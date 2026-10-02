import Section from '@/site/components/sections/Section';
import { TitreSection } from '@/site/components/sections/TitreSection';
import { Accordion, Button } from '@tet/ui';
import {
  AIDE_DEMARCHE_PCAET_URL,
  QUESTIONS_FREQUENTES,
} from './demarche-pcaet.data';

export const DemarchePcaetFAQSection = () => (
  <Section
    containerClassName="bg-primary-1 border-y border-primary-3"
    className="items-center"
  >
    <TitreSection>Questions fréquentes sur le dépôt PCAET</TitreSection>
    <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto">
      {QUESTIONS_FREQUENTES.map(({ question, reponse }) => (
        <Accordion
          key={question}
          title={question}
          content={<p className="px-8 pt-4 mb-0">{reponse}</p>}
          containerClassname="p-4 border bg-white rounded-xl"
          headerClassname="py-2 text-primary-10 font-medium"
        />
      ))}
    </div>
    <Button
      variant="underlined"
      href={AIDE_DEMARCHE_PCAET_URL}
      external
      className="after:hidden mt-4"
    >
      Voir toute l&apos;aide sur la démarche PCAET
    </Button>
  </Section>
);
