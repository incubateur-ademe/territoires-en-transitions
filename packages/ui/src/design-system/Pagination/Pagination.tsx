import classNames from 'classnames';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../Button';
import PaginationPageButton from './PaginationPageButton';
import { calculatePaginationArray } from './utils';

const COMPACT_BREAKPOINT = 992;

type PaginationProps = {
  /** Page sélectionnée */
  selectedPage: number;
  /** Nombre total d'élements */
  nbOfElements: number;
  /** Nombre d'éléments par page */
  maxElementsPerPage: number;
  /** Indique l'élément vers lequel scroller après le changement de page */
  idToScrollTo?: string;
  /** Détecte le changement de page sélectionnée */
  onChange?: (selectedPage: number) => void;
  /** Force le format compact (sinon détecté automatiquement via la largeur du container) */
  small?: boolean;
  /** Classnames custom */
  className?: string;
};

/**
 * Composant pagination
 */
export const Pagination = ({
  selectedPage,
  nbOfElements,
  maxElementsPerPage,
  idToScrollTo,
  onChange,
  small,
  className,
}: PaginationProps) => {
  const containerRef = useRef<HTMLElement>(null);
  const [containerIsNarrow, setContainerIsNarrow] = useState(false);

  const isCompact = small ?? containerIsNarrow;
  const nbOfPages = Math.ceil(nbOfElements / maxElementsPerPage);

  const pageButtons = calculatePaginationArray({
    isCompact,
    nbOfPages,
    currentPage: selectedPage,
  });

  const handleChangePage = useCallback(
    (page: number): void => {
      onChange?.(page);
      if (idToScrollTo) {
        document.getElementById(idToScrollTo)?.scrollIntoView();
      }
    },
    [onChange, idToScrollTo]
  );

  useEffect(() => {
    if (small !== undefined) return;

    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setContainerIsNarrow(width < COMPACT_BREAKPOINT);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [small]);

  return nbOfElements > maxElementsPerPage ? (
    <nav
      ref={containerRef}
      className={classNames('flex w-fit gap-6', className)}
    >
      <Button
        icon="arrow-left-s-line"
        variant="outlined"
        size="xs"
        title="Page précédente"
        onClick={() => handleChangePage(selectedPage - 1)}
        disabled={selectedPage === 1}
      >
        {!isCompact && 'Précédent'}
      </Button>

      <div className="flex gap-3">
        {pageButtons.map((pageNum, i) => (
          <PaginationPageButton
            key={i}
            pageNumber={pageNum}
            isSelected={selectedPage === pageNum}
            onClick={() => !!pageNum && handleChangePage(pageNum)}
          />
        ))}
      </div>

      <Button
        icon="arrow-right-s-line"
        iconPosition="right"
        variant="outlined"
        size="xs"
        title="Page suivante"
        onClick={() => handleChangePage(selectedPage + 1)}
        disabled={selectedPage === nbOfPages}
      >
        {!isCompact && 'Suivant'}
      </Button>
    </nav>
  ) : null;
};
