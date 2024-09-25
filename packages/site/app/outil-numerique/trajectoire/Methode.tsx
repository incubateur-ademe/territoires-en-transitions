'use client';

import Card from '@components/cards/Card';
import CardsWrapper from '@components/cards/CardsWrapper';
import Markdown from '@components/markdown/Markdown';
import Section from '@components/sections/Section';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import classNames from 'classnames';
import {StrapiItem} from 'src/strapi/StrapiItem';

type MethodeProps = {
  titre: string;
  description1: string;
  exemples: {id: number; legende: string; image?: StrapiItem}[];
  detailExemples: string;
  description2: string;
  alerte: string;
  image: StrapiItem;
};

const Methode = ({
  titre,
  description1,
  exemples,
  detailExemples,
  description2,
  alerte,
  image,
}: MethodeProps) => {
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

      {/* Exemple */}
      <Markdown
        texte={description1}
        className="paragraphe-primary-9 paragraphe-22 text-center markdown_style font-medium"
      />

      <CardsWrapper
        cols={colNumbers}
        className={classNames('mx-auto', {
          'max-w-2xl md:grid-cols-2': colNumbers === 2,
          'max-w-4xl md:grid-cols-3': colNumbers === 3,
        })}
      >
        {exemples.map(exemple => (
          <Card
            className="!gap-0"
            key={exemple.id}
            description={exemple.legende}
            image={
              exemple.image ? (
                <StrapiImage
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

      <Markdown
        texte={detailExemples}
        className="paragraphe-primary-9 paragraphe-16 text-center italic"
      />

      <div className="w-full max-w-lg h-[2px] bg-primary-4 mx-auto" />

      {/* Info complémentaires */}
      <Markdown
        texte={description2}
        className="paragraphe-primary-9 paragraphe-22 text-center markdown_style font-medium"
      />

      <div className="bg-[#FFE8BD] rounded-md p-6 text-center text-primary-9 text-lg font-bold">
        {alerte}
      </div>

      <StrapiImage
        data={image}
        className="max-h-[500px]"
        containerClassName="mx-auto h-fit mt-8"
        displayCaption={false}
      />
    </Section>
  );
};

export default Methode;
