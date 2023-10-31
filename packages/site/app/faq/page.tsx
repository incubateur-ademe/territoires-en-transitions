'use server';
/* eslint-disable react/no-unescaped-entities */

import Accordion from '@components/accordion/Accordion';
import ButtonWithLink from '@components/dstet/buttons/ButtonWithLink';
import Section from '@components/sections/Section';
import {sortByRank} from 'app/utils';
import {Metadata} from 'next';
import CommunityPicto from 'public/pictogrammes/CommunityPicto';
import PictoWithBackground from 'public/pictogrammes/PictoWithBackground';
import {fetchCollection} from 'src/strapi/strapi';

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
      <Section
        className="!flex-row justify-between items-center gap-8 flex-wrap"
        containerClassName="bg-primary-1"
      >
        <p className="mb-0 flex-auto text-center">
          Cette page n’a pas répondu à votre question ? Notre équipe est à votre
          écoute !
        </p>
        <div className="flex-auto flex justify-center items-center gap-8 flex-wrap">
          <PictoWithBackground pictogram={<CommunityPicto />} />
          <ButtonWithLink href="/contact" variant="outlined" size="big">
            Contacter l'équipe
          </ButtonWithLink>
        </div>
      </Section>
    </>
  );
};

export default Faq;
