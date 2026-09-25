'use client';

import { useWindowWidth } from '@/site/src/hooks/use-window-width';
import classNames from 'classnames';
import { Fragment, ReactNode } from 'react';

type Breakpoints = { md: number; lg: number };

type MasonryGalleryProps = {
  data: ReactNode[];
  maxCols?: 1 | 2 | 3;
  breakpoints?: Breakpoints;
  gap?: string;
  className?: string;
};

/**
 * Nombre de colonnes pour une largeur de fenêtre donnée. Tant qu'elle est
 * inconnue — rendu serveur et premier rendu client — on retient le maximum,
 * la grille étant de toute façon repliée par les classes responsive.
 */
const getColumns = (
  windowWidth: number | undefined,
  breakpoints: Breakpoints,
  maxCols: number
) => {
  if (windowWidth === undefined) return maxCols;
  if (windowWidth <= breakpoints.md) return 1;
  if (windowWidth <= breakpoints.lg) return maxCols === 3 ? 2 : 1;
  return maxCols;
};

const MasonryGallery = ({
  data,
  maxCols = 3,
  breakpoints = { md: 768, lg: 1024 },
  gap = 'gap-8',
  className,
}: MasonryGalleryProps) => {
  const windowWidth = useWindowWidth();

  // Colonnes et répartition se déduisent des props et de la largeur : les
  // garder en état, alimentés par trois effets en cascade, laissait la
  // galerie vide au premier rendu.
  const columns = getColumns(windowWidth, breakpoints, maxCols);

  const dataGallery: ReactNode[][] = Array.from({ length: columns }, () => []);
  data
    .filter((element) => element !== null)
    .forEach((element, index) => {
      dataGallery[index % columns].push(element);
    });

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
