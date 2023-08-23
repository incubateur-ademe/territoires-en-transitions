'use client';

import {fetchCollection} from 'src/strapi';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {StrapiItem} from 'src/StrapiItem';
import {useEffect, useState} from 'react';
import Section from '@components/sections/Section';
import BlogCard from '@components/cards/BlogCard';

const Actualites = () => {
  const [data, setData] = useState<StrapiItem[] | undefined>();
  const [dataGallery, setDataGallery] = useState<StrapiItem[][]>(Array(3));
  const [windowWidth, setWindowWidth] = useState<number | undefined>();
  const [columns, setColumns] = useState(3);

  const fetchData = async () => {
    const data = await fetchCollection('actualites', [
      ['populate[0]', 'Couverture'],
      ['sort[0]', 'createdAt:desc'],
    ]);
    setData(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Détecte le changement de taille de la fenêtre
  useEffect(() => {
    window.addEventListener('resize', () => setWindowWidth(window.innerWidth));
    return () =>
      window.removeEventListener('resize', () =>
        setWindowWidth(window.innerWidth),
      );
  }, []);

  // Met à jour le nombre de colonnes
  useEffect(() => {
    if (windowWidth) {
      if (windowWidth <= 768) {
        setColumns(1);
      } else if (windowWidth <= 1280) {
        setColumns(2);
      } else {
        setColumns(3);
      }
    }
  }, [windowWidth]);

  // Organise les articles par colonne
  useEffect(() => {
    const newGalleryContent: StrapiItem[][] = [];
    for (let i = 0; i < columns; i++) newGalleryContent.push([]);

    if (data) {
      data.forEach((element, index) => {
        newGalleryContent[index % columns].push(element);
      });
    }

    setDataGallery(newGalleryContent);
  }, [data, columns]);

  return data ? (
    <>
      <Section className="flex-col">
        <h2>Actualités</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {dataGallery.map((column, index) => (
            <div key={index} className="grid grid-cols-1 gap-8 h-fit">
              {column.map(actu => (
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
                          actu.attributes.Couverture
                            .data as unknown as StrapiItem
                        }
                        className="w-full"
                      />
                    ) : undefined
                  }
                  href={`/actus/${actu.id}`}
                />
              ))}
            </div>
          ))}
        </div>
      </Section>
    </>
  ) : null;
};

export default Actualites;
