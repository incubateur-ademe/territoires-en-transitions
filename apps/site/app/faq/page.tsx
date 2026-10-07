'use server';

import NoResult from '@/site/components/info/NoResult';
import Section from '@/site/components/sections/Section';
import { isPcaetLaunched } from '@/site/src/utils/is-pcaet-launched';
import { Metadata } from 'next';
import ContactEquipe from './ContactEquipe';
import { listFaqQuestions } from './faq.data';
import { FAQ_TAB_DEMARCHE_PCAET } from './faq.tabs';
import ListeQuestions from './ListeQuestions';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'FAQ',
  };
}

const Faq = async () => {
  const pcaetLaunched = await isPcaetLaunched();
  // L'onglet de la démarche PCAET n'apparaît qu'une fois la page lancée.
  const questions = (await listFaqQuestions()).filter(
    ({ onglet }) => pcaetLaunched || onglet !== FAQ_TAB_DEMARCHE_PCAET
  );

  return questions.length > 0 ? (
    <>
      <Section containerClassName="bg-primary-0">
        <h1 className="text-center">Questions fréquentes</h1>
        <ListeQuestions questions={questions} />
      </Section>
      <ContactEquipe />
    </>
  ) : (
    <NoResult />
  );
};

export default Faq;
