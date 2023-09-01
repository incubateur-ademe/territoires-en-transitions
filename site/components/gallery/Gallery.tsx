'use client';

import {Fragment, ReactNode, useEffect, useState} from 'react';

type GalleryProps = {
  data: ReactNode[];
};

const Gallery = ({data}: GalleryProps) => {
  const [dataGallery, setDataGallery] = useState<ReactNode[][]>(Array(3));
  const [windowWidth, setWindowWidth] = useState<number | undefined>(
    window.innerWidth,
  );
  const [columns, setColumns] = useState(3);

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

  // Organise les élémnents par colonne
  useEffect(() => {
    const newGalleryContent: ReactNode[][] = [];
    for (let i = 0; i < columns; i++) newGalleryContent.push([]);

    if (data) {
      data.forEach((element, index) => {
        newGalleryContent[index % columns].push(element);
      });
    }

    setDataGallery(newGalleryContent);
  }, [data, columns]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {dataGallery.map((column, index) => (
        <div key={index} className="grid grid-cols-1 gap-8 h-fit">
          {column.map((element, i) => (
            <Fragment key={i}>{element}</Fragment>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Gallery;
