'use server';

import Section from '@tet/site/components/sections/Section';
import { Metadata } from 'next';
import { fetchCollection } from '@tet/site/src/strapi/strapi';
import { sortByRank } from '@tet/site/src/utils/sortByRank';
import ContactEquipe from './ContactEquipe';
import ListeQuestions from './ListeQuestions';
import NoResult from '@tet/site/components/info/NoResult';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'FAQ',
  };
}

export type FaqData = {
  id: number;
  titre: string;
  contenu: string;
  onglet: string;
};

const getData = async () => {
  const { data } = await fetchCollection('faqs');

  const formattedData = data
    ? sortByRank(data).map((d) => ({
        id: d.id,
        titre: d.attributes.Titre as unknown as string,
        contenu: d.attributes.Contenu as unknown as string,
        onglet: d.attributes.onglet as unknown as string,
      }))
    : null;

  return formattedData;
};

const Faq = async () => {
  const questions: FaqData[] | null = await getData();

  return questions && questions.length > 0 ? (
    <>
      <Section containerClassName="bg-primary-0">
        <h1 className="text-center">Questions fréquentes</h1>
        {questions && <ListeQuestions questions={questions} />}
      </Section>
      <ContactEquipe />
    </>
  ) : (
    <NoResult />
  );
};

export default Faq;
