'use client';

import TestimonialCard from '@components/cards/TestimonialCard';
import CardsSection from '@components/sections/CardsSection';
import Slideshow from '@components/slideshow/Slideshow';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {useEffect, useState} from 'react';
import {fetchCollection} from 'src/strapi';
import {StrapiItem} from 'src/StrapiItem';

type TemoignagesProps = {
  titre: string;
  description?: string;
};

const Temoignages = ({titre, description}: TemoignagesProps) => {
  const [temoignages, setTemoignages] = useState<
    {
      id: number;
      auteur: string;
      description: string;
      contenu: string;
      image: StrapiItem;
    }[]
  >([]);

  const fetchTemoignages = async () => {
    const data = await fetchCollection('temoignages');

    const formattedData = data.map(d => ({
      id: d.id,
      auteur: d.attributes.Auteur as unknown as string,
      description: (d.attributes.Description as unknown as string) ?? undefined,
      contenu: d.attributes.Contenu as unknown as string,
      image: (d.attributes.Image.data as unknown as StrapiItem) ?? undefined,
    }));

    setTemoignages(formattedData);
  };

  useEffect(() => {
    fetchTemoignages();
  }, []);

  return temoignages.length > 1 ? (
    <CardsSection
      title={titre}
      description={description}
      cardsList={
        <Slideshow
          className="my-6 xl:mx-auto xl:w-5/6"
          autoSlide
          slides={temoignages.map(t => (
            <TestimonialCard
              key={t.id}
              content={t.contenu}
              author={t.auteur}
              role={t.description}
              image={
                t.image ? (
                  <StrapiImage
                    data={t.image}
                    className="w-[185px] h-[185px] object-cover rounded-full"
                  />
                ) : undefined
              }
            />
          ))}
        />
      }
    />
  ) : null;
};

export default Temoignages;
