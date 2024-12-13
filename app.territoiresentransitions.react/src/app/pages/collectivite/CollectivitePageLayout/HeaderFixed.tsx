import { Ref, useEffect, useRef, useState } from 'react';

import { appHeaderHeight } from '@/app/app/Layout/Header/Header';
import { useScrollTop } from 'utils/useScrollTop';

export type RenderProps = {
  isScrolled: boolean;
};

type Props = {
  render: (props: RenderProps) => React.ReactNode;
};

/**
 * Rend le header d'une page collectivité fixe et permet de réduire les éléments
 * en exposant un booléen `isScrolled` quand le header passe en mode fixe.
 *
 * Le contenu à rendre fixe doit être donner à la propriété `render` dans laquelle est exposée `isScrolled`
 * */
const HeaderFixed = ({ render }: Props) => {
  // détermine si la page a suffisamment défilée pour afficher la version
  // réduite de l'en-tête
  const scrollTop = useScrollTop('main');
  const isScrolled = scrollTop >= appHeaderHeight;

  const headerRef: Ref<HTMLDivElement> = useRef(null);

  /**
   * Nous devons gérer la hauteur de la <div /> qui englobe tout le composant sticky.
   * Si nous ne le faisons pas, quand le header passe en version réduite, cela modifie la hauteur du scroll de la page et
   * rentre dans une boucle infinie au moment où le header devient sticky.
   */
  const [controlledHeight, setHeaderHeight] = useState<number | undefined>();
  const [headerOriginalHeight, setHeaderOriginalHeight] = useState<
    number | undefined
  >();
  const [headerOriginalWidth, setHeaderOriginalWidth] = useState<
    number | undefined
  >();

  /** Au montage du composant, nous stockons les valeurs initiales du header */
  useEffect(() => {
    setHeaderOriginalHeight(
      document.getElementById('page-header-wrapper')?.clientHeight
    );
    setHeaderOriginalWidth(
      document.getElementById('page-header-wrapper')?.clientWidth
    );
  }, []);

  /**
   * Quand le header change de largeur (toggle de la sidenav ou du panel),
   * nous modifions la hauteur car le titre du header peut passer sur plusieurs ligne
   * et donc augmenter la taille du header visible à l'écran, ce qui refait flicker le header au scroll.
   */
  useEffect(() => {
    if (headerRef.current) {
      if (headerOriginalWidth === headerRef.current?.clientWidth) {
        setHeaderHeight(headerOriginalHeight);
      } else {
        setHeaderHeight(
          document.getElementById('page-header-wrapper')?.clientHeight
        );
      }
    }
  }, [headerRef.current?.clientWidth]);

  return (
    <div
      ref={headerRef}
      id="page-header-wrapper"
      style={{ minHeight: `${controlledHeight}px` }}
      className="sticky top-0 z-40 pointer-events-none"
    >
      <div className="pointer-events-auto">
        {render({
          isScrolled,
        })}
      </div>
    </div>
  );
};

export default HeaderFixed;
