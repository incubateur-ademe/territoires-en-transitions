'use client';

import { Vignette } from '@/site/app/types';
import Card from '@/site/components/cards/Card';
import CardsWrapper from '@/site/components/cards/CardsWrapper';
import Markdown from '@/site/components/markdown/Markdown';
import Section from '@/site/components/sections/Section';
import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';
import classNames from 'classnames';

type MethodeProps = {
  titre: string;
  description: string;
  exemples: Vignette[];
  image: StrapiItem;
};

const Methode = ({ titre, description, exemples, image }: MethodeProps) => {
  let colNumbers = 3;

  if (exemples.length === 2) {
    colNumbers = 2;
  } else if (
    exemples.length % 4 === 0 ||
    (exemples.length % 3 !== 0 && exemples.length % 4 > exemples.length % 3)
  ) {
    colNumbers = 4;
  }

  return (
    <Section
      containerClassName="bg-primary-1 max-md:!py-6 md:max-lg:!py-12 lg:!py-20"
      className="gap-6"
    >
      {/* Titre */}
      <h2 className="text-center text-primary-10 mb-0">{titre}</h2>

      {/* Illustration */}
      <DEPRECATED_StrapiImage
        data={image}
        className="max-h-[500px]"
        containerClassName="mx-auto h-fit mt-8"
        displayCaption={false}
      />

      {/* Exemple */}
      <Markdown
        texte={description}
        className="paragraphe-primary-9 paragraphe-22 text-center markdown_style font-medium"
      />

      <CardsWrapper
        cols={colNumbers}
        className={classNames('mx-auto', {
          'max-w-2xl md:grid-cols-2': colNumbers === 2,
          'max-w-4xl md:grid-cols-3': colNumbers === 3,
        })}
      >
        {exemples.map((exemple) => (
          <Card
            className="!gap-0"
            key={exemple.id}
            subtitle={exemple.titre ?? ''}
            description={exemple.legende ?? ''}
            image={
              exemple.image ? (
                <DEPRECATED_StrapiImage
                  data={exemple.image}
                  displayCaption={false}
                  containerClassName="h-20"
                  className="h-full"
                />
              ) : undefined
            }
          />
        ))}
      </CardsWrapper>
    </Section>
  );
};

export default Methode;
