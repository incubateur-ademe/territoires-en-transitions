import classNames from 'classnames';
import { useEffect, useState } from 'react';
import { Button } from '../Button';
import PaginationPageButton from './PaginationPageButton';
import { calculatePaginationArray } from './utils';

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
  /** Format réduit */
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
  small = false,
  className,
}: PaginationProps) => {
  const [nbOfPages, setNbOfPages] = useState(
    Math.ceil(nbOfElements / maxElementsPerPage)
  );
  const [pageButtons, setPageButtons] = useState<(number | undefined)[]>([]);
  const [currentPage, setCurrentPage] = useState(selectedPage);
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [isMobile, setIsMobile] = useState(false);

  const handleChangePage = (page: number) => {
    setCurrentPage(page);
    onChange?.(page);
    !!idToScrollTo && document.getElementById(idToScrollTo)?.scrollIntoView();
  };

  // Détecte la largeur de page
  useEffect(() => {
    setWindowWidth(window.innerWidth);

    window.addEventListener('resize', () => setWindowWidth(window.innerWidth));
    return () =>
      window.removeEventListener('resize', () =>
        setWindowWidth(window.innerWidth)
      );
  }, []);

  // Détecte le changement de largeur de la page
  useEffect(() => {
    windowWidth < 992 ? setIsMobile(true) : setIsMobile(false);
  }, [windowWidth]);

  // Détecte le changement de page sélectionnée en props
  useEffect(() => {
    setCurrentPage(selectedPage);
  }, [selectedPage]);

  // Détecte les changement nécessitant le recalcul des boutons
  useEffect(() => {
    const paginationArray = calculatePaginationArray({
      isMobile,
      nbOfPages,
      currentPage,
      small,
    });

    setPageButtons(paginationArray);
  }, [currentPage, nbOfPages, isMobile]);

  // Détecte un changement du nombre de pages
  useEffect(() => {
    setNbOfPages(Math.ceil(nbOfElements / maxElementsPerPage));
  }, [nbOfElements, maxElementsPerPage]);

  return nbOfElements > maxElementsPerPage ? (
    <nav className={classNames('flex w-fit gap-6', className)}>
      <Button
        icon="arrow-left-s-line"
        variant="outlined"
        size="xs"
        title="Page précédente"
        onClick={() => handleChangePage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        {!isMobile && 'Précédent'}
      </Button>

      <div className="flex gap-3">
        {pageButtons.map((pageNum, i) => (
          <PaginationPageButton
            key={i}
            pageNumber={pageNum}
            isSelected={currentPage === pageNum}
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
        onClick={() => handleChangePage(currentPage + 1)}
        disabled={currentPage === nbOfPages}
      >
        {!isMobile && 'Suivant'}
      </Button>
    </nav>
  ) : null;
};
