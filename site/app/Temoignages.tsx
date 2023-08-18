'use client';

import TestimonialCard from '@components/cards/TestimonialCard';
import CardsSection from '@components/sections/CardsSection';
import Slideshow from '@components/slideshow/Slideshow';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {Attributes, useEffect, useState} from 'react';
import {fetchCollection} from 'src/strapi';
import {StrapiItem} from 'src/StrapiItem';

const Temoignages = () => {
  const [temoignages, setTemoignages] = useState<
    {
      id: number;
      auteur: Attributes;
      description: Attributes;
      contenu: Attributes;
      image: StrapiItem;
    }[]
  >([]);

  const fecthTemoignages = async () => {
    const data = await fetchCollection('temoignages');

    const formattedData = data.map(d => ({
      id: d.id,
      auteur: d.attributes.Auteur,
      description: d.attributes.Description ?? undefined,
      contenu: d.attributes.Contenu,
      image: (d.attributes.Image.data as unknown as StrapiItem) ?? undefined,
    }));

    setTemoignages(formattedData);
  };

  useEffect(() => {
    fecthTemoignages();
  }, []);

  return temoignages.length > 1 ? (
    <CardsSection
      title="Rejoignez une communauté de collectivités engagées"
      cardsList={
        <Slideshow
          className="my-6 xl:mx-auto xl:w-5/6"
          autoSlide
          slides={temoignages.map(t => (
            <TestimonialCard
              key={t.id}
              content={t.contenu as string}
              author={t.auteur as string}
              role={t.description as string}
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
