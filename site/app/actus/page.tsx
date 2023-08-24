'use server';

import {fetchCollection} from 'src/strapi';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {StrapiItem} from 'src/StrapiItem';
import Section from '@components/sections/Section';
import BlogCard from '@components/cards/BlogCard';
import Gallery from '@components/gallery/Gallery';

type ActuCard = {
  id: number;
  titre: string;
  dateCreation: Date;
  resume?: string;
  couverture: StrapiItem;
};

export const getData = async () => {
  const data = await fetchCollection('actualites', [
    ['populate[0]', 'Couverture'],
    ['sort[0]', 'createdAt:desc'],
  ]);

  const formattedData: ActuCard[] = data.map(d => ({
    id: d.id,
    titre: d.attributes.Titre as unknown as string,
    dateCreation:
      (d.attributes.DateCreation as unknown as Date) ??
      (d.attributes.createdAt as unknown as Date),
    resume: (d.attributes.Resume as unknown as string) ?? undefined,
    couverture: d.attributes.Couverture.data as unknown as StrapiItem,
  }));

  return formattedData;
};

const Actualites = async () => {
  const data: ActuCard[] = await getData();

  return data ? (
    <Section className="flex-col">
      <h2>Actualités</h2>
      <Gallery
        data={data.map(actu => (
          <BlogCard
            key={actu.id}
            backgroundColor="#f5f5fe"
            title={actu.titre}
            date={actu.dateCreation}
            description={actu.resume}
            image={
              actu.couverture ? (
                <StrapiImage data={actu.couverture} className="w-full" />
              ) : undefined
            }
            href={`/actus/${actu.id}`}
          />
        ))}
      />
    </Section>
  ) : null;
};

export default Actualites;
