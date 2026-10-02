'use server';

import NoResult from '@/site/components/info/NoResult';
import Section from '@/site/components/sections/Section';
import { fetchCollection } from '@/site/src/strapi/strapi';
import { sortByRank } from '@/site/src/utils/sortByRank';
import { Metadata } from 'next';
import { QUESTIONS_FREQUENTES } from '../demarche-pcaet/demarche-pcaet.data';
import ContactEquipe from './ContactEquipe';
import { FAQ_ONGLET_DEMARCHE_PCAET } from './faq.onglets';
import ListeQuestions from './ListeQuestions';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'FAQ',
  };
}

export type FaqData = {
  id: string;
  titre: string;
  contenu: string;
  onglet: string;
};

const getData = async () => {
  const { data } = await fetchCollection('faqs');

  const formattedData = data
    ? sortByRank(data).map((d) => ({
        id: d.id.toString(),
        titre: d.attributes.Titre as unknown as string,
        contenu: d.attributes.Contenu as unknown as string,
        onglet: d.attributes.onglet as unknown as string,
      }))
    : null;

  return formattedData;
};

/** Même source que la FAQ de la page Démarche PCAET. */
const QUESTIONS_DEMARCHE_PCAET: FaqData[] = QUESTIONS_FREQUENTES.map(
  ({ question, reponse }, index) => ({
    id: `demarche-pcaet-${index}`,
    titre: question,
    contenu: reponse,
    onglet: FAQ_ONGLET_DEMARCHE_PCAET,
  })
);

const Faq = async () => {
  const questions: FaqData[] = [
    ...((await getData()) ?? []),
    ...QUESTIONS_DEMARCHE_PCAET,
  ];

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
