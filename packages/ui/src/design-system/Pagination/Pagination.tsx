import classNames from 'classnames';
import {Button} from '@design-system/Button';
import {useEffect, useState} from 'react';
import PaginationPageButton from './PaginationPageButton';
import {calculatePaginationArray} from './utils';

type PaginationProps = {
  /** Page sélectionnée */
  selectedPage: number;
  /** Nombre total de page */
  nbOfPages: number;
  /** Détecte le changement de page sélectionnée */
  onChange?: (selectedPage: number) => void;
  /** Classnames custom */
  className?: string;
};

/**
 * Composant pagination
 */
export const Pagination = ({
  selectedPage,
  nbOfPages,
  onChange,
  className,
}: PaginationProps) => {
  const [pageButtons, setPageButtons] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(selectedPage);
  const [windowWidth, setWindowWidth] = useState<number | undefined>();
  const [isMobile, setIsMobile] = useState(false);

  const handleChangePage = (page: number) => {
    setCurrentPage(page);
    onChange?.(page);
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
    document.getElementById('app-header')?.scrollIntoView();
  }, [selectedPage]);

  // Détecte les changement nécessitant le recalcul des boutons
  useEffect(() => {
    const paginationArray = calculatePaginationArray({
      isMobile,
      nbOfPages,
      currentPage,
    });

    setPageButtons(paginationArray);
  }, [currentPage, nbOfPages, isMobile]);

  return (
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
            onClick={() => handleChangePage(pageNum)}
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
  );
};
