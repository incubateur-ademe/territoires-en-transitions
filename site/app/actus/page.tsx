'use server';

import {fetchCollection} from 'src/strapi';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {StrapiItem} from 'src/StrapiItem';
import Section from '@components/sections/Section';
import BlogCard from '@components/cards/BlogCard';
import Gallery from '@components/gallery/Gallery';

export const getData = async () => {
  const data = await fetchCollection('actualites', [
    ['populate[0]', 'Couverture'],
    ['sort[0]', 'createdAt:desc'],
  ]);

  return data;
};

const Actualites = async () => {
  const data: StrapiItem[] = await getData();

  return data ? (
    <>
      <Section className="flex-col">
        <h2>Actualités</h2>
        <Gallery
          data={data.map(actu => (
            <BlogCard
              key={actu.id}
              backgroundColor="#f5f5fe"
              title={actu.attributes.Titre as unknown as string}
              date={
                (actu.attributes.DateCreation as unknown as Date) ??
                actu.attributes.createdAt
              }
              description={actu.attributes.Resume as unknown as string}
              image={
                actu.attributes.Couverture.data ? (
                  <StrapiImage
                    data={
                      actu.attributes.Couverture.data as unknown as StrapiItem
                    }
                    className="w-full"
                  />
                ) : undefined
              }
              href={`/actus/${actu.id}`}
            />
          ))}
        />
      </Section>
    </>
  ) : null;
};

export default Actualites;
