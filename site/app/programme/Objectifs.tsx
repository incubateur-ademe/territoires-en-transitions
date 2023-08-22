'use client';

import CardsWrapper from '@components/cards/CardsWrapper';
import CardsSection from '@components/sections/CardsSection';
import {useEffect, useState} from 'react';
import {fetchCollection} from 'src/strapi';
import {StrapiItem} from 'src/StrapiItem';
import DOMPurify from 'dompurify';
import {marked} from 'marked';
import {StrapiImage} from '@components/strapiImage/StrapiImage';

type ObjectifsProps = {
  titre: string;
  description?: string;
};

const Objectifs = ({titre, description}: ObjectifsProps) => {
  const [objectifs, setObjectifs] = useState<
    {
      id: number;
      description: string;
      picto: StrapiItem;
    }[]
  >([]);

  const fetchObjectifs = async () => {
    const data = await fetchCollection('objectifs');

    const formattedData = data.map(d => ({
      id: d.id,
      description: d.attributes.Description as unknown as string,
      picto: d.attributes.Pictogramme.data as unknown as StrapiItem,
    }));

    setObjectifs(formattedData);
  };

  useEffect(() => {
    fetchObjectifs();
  }, []);

  return objectifs.length ? (
    <CardsSection
      title={titre}
      description={description}
      cardsList={
        <CardsWrapper cols={5}>
          {objectifs.map((o, index) => (
            <div key={index} className="flex flex-col items-center gap-8">
              <div className="w-[140px] h-[140px] bg-white rounded-full flex items-center justify-center">
                <picture>
                  <StrapiImage data={o.picto} />
                </picture>
              </div>
              <p
                className="text-center"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(marked.parse(o.description)),
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
