'use server';

import BlogCard from '@/site/components/cards/BlogCard';
import MasonryGallery from '@/site/components/galleries/MasonryGallery';
import Section from '@/site/components/sections/Section';
import { fetchCollection } from '@/site/src/strapi/strapi';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';
import { convertNameToSlug } from '@/site/src/utils/convertNameToSlug';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

const LIMIT = 50;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Actualités',
  };
}

type ActuCard = {
  id: number;
  titre: string;
  dateCreation: Date;
  epingle: boolean;
  resume?: string;
  couverture: StrapiItem;
};

const getData = async () => {
  const { data, meta } = await fetchCollection('actualites', [
    ['populate[0]', 'Couverture'],
    ['sort[0]', 'createdAt:desc'],
    ['pagination[start]', '0'],
    ['pagination[limit]', `${LIMIT}`],
  ]);

  const { pagination } = meta;
  const cards = data;
  let page = 1;

  while (page < Math.ceil(pagination.total / pagination.limit)) {
    const { data } = await fetchCollection('actualites', [
      ['populate[0]', 'Couverture'],
      ['sort[0]', 'createdAt:desc'],
      ['pagination[start]', `${page * LIMIT}`],
      ['pagination[limit]', `${LIMIT}`],
    ]);
    cards.push(...data);
    page++;
  }

  const formattedData: ActuCard[] | null = cards
    ? cards.map((d) => ({
        id: d.id,
        titre: d.attributes.Titre as unknown as string,
        dateCreation:
          (d.attributes.DateCreation as unknown as Date) ??
          (d.attributes.createdAt as unknown as Date),
        epingle: (d.attributes.Epingle as unknown as boolean) ?? false,
        resume: (d.attributes.Resume as unknown as string) ?? undefined,
        couverture: d.attributes.Couverture.data as unknown as StrapiItem,
      }))
    : null;

  return formattedData
    ? formattedData.sort((a, b) => {
        if (a.epingle && !b.epingle) return -1;
        if (!a.epingle && b.epingle) return 1;

        return (
          new Date(b.dateCreation).getTime() -
          new Date(a.dateCreation).getTime()
        );
      })
    : null;
};

const Actualites = async () => {
  const data: ActuCard[] | null = await getData();

  if (!data) return notFound();

  return (
    <Section>
      <h1>Actualités</h1>
      <MasonryGallery
        data={data.map((actu) => (
          <BlogCard
            key={actu.id}
            title={actu.titre}
            date={actu.dateCreation}
            description={actu.resume}
            image={actu.couverture}
            badge={actu.epingle ? 'À la une' : undefined}
            href={`/actus/${actu.id}/${convertNameToSlug(actu.titre)}`}
          />
        ))}
      />
    </Section>
  );
};

export default Actualites;
