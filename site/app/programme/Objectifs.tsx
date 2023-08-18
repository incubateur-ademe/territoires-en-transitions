'use client';

import CardsWrapper from '@components/cards/CardsWrapper';
import CardsSection from '@components/sections/CardsSection';
import {Attributes, useEffect, useState} from 'react';
import {fetchCollection} from 'src/strapi';
import {StrapiItem} from 'src/StrapiItem';
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
      description: Attributes;
      picto: StrapiItem;
    }[]
  >([]);

  const fetchObjectifs = async () => {
    const data = await fetchCollection('objectifs');

    const formattedData = data.map(d => ({
      id: d.id,
      description: d.attributes.Description,
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
                  __html: marked.parse(o.description as string),
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
