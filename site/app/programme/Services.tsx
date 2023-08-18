'use client';

import BlogCard from '@components/cards/BlogCard';
import CardsWrapper from '@components/cards/CardsWrapper';
import CardsSection from '@components/sections/CardsSection';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {Attributes, useEffect, useState} from 'react';
import {fetchCollection} from 'src/strapi';
import {StrapiItem} from 'src/StrapiItem';

type ServicesProps = {
  titre: string;
  description?: string;
};

const Services = ({titre, description}: ServicesProps) => {
  const [services, setServices] = useState<
    {
      id: number;
      titre: Attributes;
      description: Attributes;
      image: StrapiItem;
      href: Attributes;
    }[]
  >([]);

  const fetchServices = async () => {
    const data = await fetchCollection('services');

    const formattedData = data.map(d => ({
      id: d.id,
      titre: d.attributes.Titre,
      description: d.attributes.Description ?? undefined,
      image: (d.attributes.Image.data as unknown as StrapiItem) ?? undefined,
      href: d.attributes.URL ?? undefined,
    }));

    setServices(formattedData);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return services.length ? (
    <CardsSection
      title={titre}
      description={description}
      cardsList={
        <CardsWrapper cols={3}>
          {services.length > 0 &&
            services.map(s => (
              <BlogCard
                key={s.id}
                title={s.titre as string}
                description={s.description as string}
                image={
                  s.image ? (
                    <StrapiImage data={s.image} className="w-full" />
                  ) : undefined
                }
                href={s.href as string}
              />
            ))}
        </CardsWrapper>
      }
    />
  ) : null;
};

export default Services;
