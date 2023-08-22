'use client';

import BlogCard from '@components/cards/BlogCard';
import CardsWrapper from '@components/cards/CardsWrapper';
import CardsSection from '@components/sections/CardsSection';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {useEffect, useState} from 'react';
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
      titre: string;
      description: string;
      image: StrapiItem;
      href: string;
    }[]
  >([]);

  const fetchServices = async () => {
    const data = await fetchCollection('services');

    const formattedData = data.map(d => ({
      id: d.id,
      titre: d.attributes.Titre as unknown as string,
      description: (d.attributes.Description as unknown as string) ?? undefined,
      image: (d.attributes.Image.data as unknown as StrapiItem) ?? undefined,
      href: (d.attributes.URL as unknown as string) ?? undefined,
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
                title={s.titre}
                description={s.description}
                image={
                  s.image ? (
                    <StrapiImage data={s.image} className="w-full" />
                  ) : undefined
                }
                href={s.href}
              />
            ))}
        </CardsWrapper>
      }
    />
  ) : null;
};

export default Services;
