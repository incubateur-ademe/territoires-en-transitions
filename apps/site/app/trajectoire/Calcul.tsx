'use client';

import { Vignette } from '@/site/app/types';
import CardsWrapper from '@/site/components/cards/CardsWrapper';
import Markdown from '@/site/components/markdown/Markdown';
import Section from '@/site/components/sections/Section';
import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';
import classNames from 'classnames';

type CalculProps = {
  titre: string;
  description: string;
  liste: Vignette[];
  backgroundColor?: 'bg-primary-0' | 'bg-primary-1';
};

const Calcul = ({
  titre,
  description,
  liste,
  backgroundColor = 'bg-primary-1',
}: CalculProps) => {
  return (
    <Section
      containerClassName={classNames(
        'max-md:!py-6 md:max-lg:!py-12 lg:!py-20',
        backgroundColor
      )}
      className="gap-9"
    >
      <h2 className="text-center text-primary-8 mb-0">{titre}</h2>
      <Markdown
        texte={description}
        className="text-center paragraphe-22 paragraphe-primary-9 markdown_style"
      />
      <CardsWrapper cols={2} className="max-w-5xl mx-auto">
        {liste.map((elt) => (
          <div
            key={elt.id}
            className="bg-white p-4 md:p-6 xl:p-8 rounded-lg flex flex-col gap-4"
            style={{ boxShadow: '0px 4px 20px 0px #F0F0FE' }}
          >
            {!!elt.image && (
              <DEPRECATED_StrapiImage
                data={elt.image}
                displayCaption={false}
                containerClassName="h-20"
                className="h-full"
              />
            )}
            <div>
              {!!elt.titre && <h3 className="mb-4">{elt.titre}</h3>}

              {!!elt.legende && (
                <Markdown
                  texte={elt.legende}
                  className="paragraphe-16 paragraphe-primary-9 markdown_style"
                />
              )}
            </div>
          </div>
        ))}
      </CardsWrapper>
    </Section>
  );
};

export default Calcul;
