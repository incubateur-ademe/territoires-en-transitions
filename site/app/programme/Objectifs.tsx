'use client';

import CardsWrapper from '@components/cards/CardsWrapper';
import CardsSection from '@components/sections/CardsSection';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {processMarkedContent} from 'src/utils/processMarkedContent';
import {useEffect, useState} from 'react';
import {Content} from './utils';

type ObjectifsProps = {
  titre: string;
  description?: string;
  contenu: Content[] | null;
};

const Objectifs = ({titre, description, contenu}: ObjectifsProps) => {
  const [processedContent, setProcessedContent] = useState<Content[]>([]);

  const processContent = async () => {
    if (contenu) {
      const newContent = [...contenu];

      newContent.forEach(async c => {
        const newDescription = await processMarkedContent(c.description);
        c.description = newDescription;
      });

      setProcessedContent(newContent);
    }
  };

  useEffect(() => {
    processContent();
  }, []);

  return contenu && processedContent.length ? (
    <CardsSection
      title={titre}
      description={description}
      cardsList={
        <CardsWrapper cols={5}>
          {processedContent.map((c, index) => (
            <div key={index} className="flex flex-col items-center gap-8">
              <div className="w-[140px] h-[140px] bg-white rounded-full flex items-center justify-center">
                <picture>
                  <StrapiImage data={c.image} />
                </picture>
              </div>
              <p
                className="text-center"
                dangerouslySetInnerHTML={{
                  __html: c.description,
                }}
              />
            </div>
          ))}
        </CardsWrapper>
      }
      customBackground="#fff6f0"
    />
  ) : null;
};

export default Objectifs;
