'use client';

import Section from '@components/sections/Section';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {useEffect, useState} from 'react';
import {StrapiItem} from 'src/strapi/StrapiItem';
import {processMarkedContent} from 'src/utils/processMarkedContent';

type IntroductionProps = {
  description: string;
  logos?: StrapiItem[];
};

const Introduction = ({description, logos}: IntroductionProps) => {
  const [processedText, setProcessedText] = useState<string>('');

  const processContent = async (texte: string) => {
    const newText = await processMarkedContent(texte);
    setProcessedText(newText);
  };

  useEffect(() => {
    if (description) processContent(description);
  }, []);

  return (
    <Section
      customBackground="#fff"
      containerClassName="!pt-0 !pb-6"
      className="article flex-col md:block"
    >
      {/* Logos de la collectivités */}
      {logos && (
        <div className="flex flex-wrap md:flex-nowrap items-end justify-center gap-8 mr-8 mb-4 float-left w-full md:w-auto md:max-w-[35%]">
          {logos.map(l => (
            <StrapiImage
              key={l.id}
              data={l}
              className="max-h-[300px]"
              displayCaption={false}
            />
          ))}
        </div>
      )}

      {/* Texte de présentation */}
      <div
        dangerouslySetInnerHTML={{
          __html: processedText,
        }}
      />
    </Section>
  );
};

export default Introduction;
