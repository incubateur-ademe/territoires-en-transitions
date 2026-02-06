'use client';

import classNames from 'classnames';
import {
  Fragment,
  ReactNode,
  useEffect,
  useEffectEvent,
  useState,
} from 'react';

type MasonryGalleryProps = {
  data: ReactNode[];
  maxCols?: 1 | 2 | 3;
  breakpoints?: { md: number; lg: number };
  gap?: string;
  className?: string;
};

const MasonryGallery = ({
  data,
  maxCols = 3,
  breakpoints = { md: 768, lg: 1024 },
  gap = 'gap-8',
  className,
}: MasonryGalleryProps) => {
  const [dataGallery, setDataGallery] = useState<ReactNode[][]>(Array(maxCols));
  const updateDataGallery = useEffectEvent((value: ReactNode[][]) =>
    setDataGallery(value)
  );

  const [windowWidth, setWindowWidth] = useState<number | undefined>();
  const updateWindowWidth = useEffectEvent((value: number | undefined) =>
    setWindowWidth(value)
  );

  const [columns, setColumns] = useState(3);
  const updateColumns = useEffectEvent((value: number) => setColumns(value));

  useEffect(() => {
    // Initialisation de windowWith au chargement de la page
    updateWindowWidth(window.innerWidth);

    // Détecte le changement de taille de la fenêtre
    window.addEventListener('resize', () => setWindowWidth(window.innerWidth));
    return () =>
      window.removeEventListener('resize', () =>
        setWindowWidth(window.innerWidth)
      );
  }, []);

  // Met à jour le nombre de colonnes
  useEffect(() => {
    if (windowWidth) {
      if (windowWidth <= breakpoints.md) {
        updateColumns(1);
      } else if (windowWidth <= breakpoints.lg) {
        if (maxCols === 3) updateColumns(2);
        else updateColumns(1);
      } else updateColumns(maxCols);
    }
  }, [windowWidth, breakpoints.md, breakpoints.lg, maxCols]);

  // Organise les élémnents par colonne
  useEffect(() => {
    const newGalleryContent: ReactNode[][] = [];
    for (let i = 0; i < columns; i++) newGalleryContent.push([]);

    if (data) {
      data
        .filter((d) => d !== null)
        .forEach((element, index) => {
          newGalleryContent[index % columns].push(element);
        });
    }

    updateDataGallery(newGalleryContent);
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
        className
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

export default MasonryGallery;
