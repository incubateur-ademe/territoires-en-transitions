/* eslint-disable react/no-unescaped-entities */
'use server';

import Accordion from '@components/accordion/Accordion';
import ButtonWithLink from '@components/buttons/ButtonWithLink';
import Section from '@components/sections/Section';
import CommunityPicto from 'public/pictogrammes/CommunityPicto';
import PictoWithBackground from 'public/pictogrammes/PictoWithBackground';
import {fetchCollection} from 'src/strapi';

type FaqData = {
  id: number;
  titre: string;
  contenu: string;
};

export const getData = async () => {
  const data = await fetchCollection('faqs');

  const formattedData = data.map(d => ({
    id: d.id,
    titre: d.attributes.Titre as unknown as string,
    contenu: d.attributes.Contenu as unknown as string,
  }));

  return formattedData;
};

const Faq = async () => {
  const questions: FaqData[] = await getData();

  return (
    <>
      <Section className="flex-col">
        <h1>Questions fréquentes</h1>
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
      </Section>
      <Section className="justify-between items-center">
        <p className="mb-0">
          Cette page n’a pas répondu à votre question ? Notre équipe est à votre
          écoute !
        </p>
        <div className="flex justify-between items-center gap-8">
          <PictoWithBackground pictogram={<CommunityPicto />} />
          <ButtonWithLink href="/contact" secondary>
            Contacter l'équipe
          </ButtonWithLink>
        </div>
      </Section>
    </>
  );
};

export default Faq;
