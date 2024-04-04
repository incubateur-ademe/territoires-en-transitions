'use server';

import Accordion from '@components/accordion/Accordion';
import Section from '@components/sections/Section';
import {Metadata} from 'next';
import {fetchCollection} from 'src/strapi/strapi';
import {sortByRank} from 'src/utils/sortByRank';
import ContactEquipe from './ContactEquipe';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'FAQ',
  };
}

type FaqData = {
  id: number;
  titre: string;
  contenu: string;
};

const getData = async () => {
  const data = await fetchCollection('faqs');

  const formattedData = data
    ? sortByRank(data).map(d => ({
        id: d.id,
        titre: d.attributes.Titre as unknown as string,
        contenu: d.attributes.Contenu as unknown as string,
      }))
    : null;

  return formattedData;
};

const Faq = async () => {
  const questions: FaqData[] | null = await getData();

  return (
    <>
      <Section>
        <h1>Questions fréquentes</h1>
        {questions && (
          <div>
            {questions.map(q => (
              <Accordion
                key={q.id}
                id={q.id.toString()}
                title={q.titre}
                content={q.contenu}
              />
            ))}
          </div>
        )}
      </Section>
      <ContactEquipe />
    </>
  );
};

export default Faq;
