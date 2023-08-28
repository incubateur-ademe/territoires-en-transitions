/* eslint-disable react/no-unescaped-entities */
'use server';

import Accordion from '@components/accordion/Accordion';
import ButtonWithLink from '@components/buttons/ButtonWithLink';
import Section from '@components/sections/Section';
import CommunityPicto from 'public/pictogrammes/CommunityPicto';
import PictoWithBackground from 'public/pictogrammes/PictoWithBackground';
import {fetchCollection} from 'src/strapi/strapi';

type FaqData = {
  id: number;
  titre: string;
  contenu: string;
};

const getData = async () => {
  const data = await fetchCollection('faqs');

  const formattedData = data
    ? data.map(d => ({
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
      <Section className="flex-col">
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
      <Section className="justify-between items-center gap-8 flex-wrap">
        <p className="mb-0 flex-auto text-center">
          Cette page n’a pas répondu à votre question ? Notre équipe est à votre
          écoute !
        </p>
        <div className="flex-auto flex justify-center items-center gap-8 flex-wrap">
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
