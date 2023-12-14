'use client';

import classNames from 'classnames';
import {Fragment, ReactNode, useEffect, useState} from 'react';

type GalleryProps = {
  data: ReactNode[];
  maxCols?: 1 | 2 | 3;
  breakpoints?: {md: number; lg: number};
  gap?: string;
  className?: string;
};

const Gallery = ({
  data,
  maxCols = 3,
  breakpoints = {md: 768, lg: 1280},
  gap = 'gap-8',
  className,
}: GalleryProps) => {
  const [dataGallery, setDataGallery] = useState<ReactNode[][]>(Array(maxCols));
  const [windowWidth, setWindowWidth] = useState<number | undefined>();
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    // Initialisation de windowWith au chargement de la page
    setWindowWidth(window.innerWidth);

    // Détecte le changement de taille de la fenêtre
    window.addEventListener('resize', () => setWindowWidth(window.innerWidth));
    return () =>
      window.removeEventListener('resize', () =>
        setWindowWidth(window.innerWidth),
      );
  }, []);

  // Met à jour le nombre de colonnes
  useEffect(() => {
    if (windowWidth) {
      if (windowWidth <= breakpoints.md) {
        setColumns(1);
      } else if (windowWidth <= breakpoints.lg) {
        if (maxCols === 3) setColumns(2);
        else setColumns(1);
      } else {
        if (maxCols === 3) setColumns(3);
        else if (maxCols === 2) setColumns(2);
        else setColumns(1);
      }
    }
  }, [windowWidth, breakpoints.md, breakpoints.lg, maxCols]);

  // Organise les élémnents par colonne
  useEffect(() => {
    const newGalleryContent: ReactNode[][] = [];
    for (let i = 0; i < columns; i++) newGalleryContent.push([]);

    if (data) {
      data
        .filter(d => d !== null)
        .forEach((element, index) => {
          newGalleryContent[index % columns].push(element);
        });
    }

    setDataGallery(newGalleryContent);
  }, [data, columns]);

  return (
    <div
      className={classNames(
        'grid grid-cols-1',
        {
          'md:grid-cols-2': maxCols === 3,
          'lg:grid-cols-2': maxCols === 2,
          'xl:grid-cols-3': maxCols === 3,
        },
        gap,
        className,
      )}
    >
      {dataGallery.map((column, index) => (
        <div key={index} className={classNames('grid grid-cols-1 h-fit', gap)}>
          {column.map((element, i) => (
            <Fragment key={i}>{element}</Fragment>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Gallery;
