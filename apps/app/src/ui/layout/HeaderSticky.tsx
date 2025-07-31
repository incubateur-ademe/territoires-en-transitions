import { Ref, useEffect, useRef, useState } from 'react';

type Props = {
  render: ({ isSticky }: { isSticky: boolean }) => React.ReactNode;
};

/**
 * Rend le header d'une page sticky et permet de réduire les éléments
 * en exposant un booléen `isSticky` quand le header passe en mode fixe.
 *
 * Le contenu à afficher doit être rendu avec la propriété `render` dans laquelle est exposée `isSticky`
 *
 * Ce composant permet de
 * */
const HeaderSticky = ({ render }: Props) => {
  const headerRef: Ref<HTMLDivElement> = useRef(null);

  const [isSticky, setIsSticky] = useState(false);

  /**
   * Nous devons gérer la hauteur de la <div /> qui englobe tout le composant sticky.
   * Si nous ne le faisons pas, quand le header passe en version réduite, cela modifie la hauteur du scroll de la page et
   * rentre dans une boucle infinie au moment où le header devient sticky.
   */
  const [originalHeight, setOriginalHeight] = useState<number | undefined>();

  useEffect(() => {
    /** Détermine la taille originale du header */
    if (!headerRef.current) return;
    const observer = new ResizeObserver(() => {
      setOriginalHeight(headerRef.current?.offsetHeight ?? 0);
    });
    observer.observe(headerRef.current);

    /** Détermine si le header est sticky */
    const handleScroll = () => {
      if (!headerRef.current) return;
      const { top } = headerRef.current.getBoundingClientRect();
      // top === 0 signifie que le haut de l’élément touche le haut du viewport
      setIsSticky(top <= 0);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  /**
   * pointer-event est set pour permettre l'interaction avec les éléments sous la div qui a la taille originale.
   * Il est possible d'améliorer cela mais cela demande pas mal d'efforts, à voir plus tard si nécessaire.
   */
  return (
    <div
      ref={headerRef}
      style={{ minHeight: `${originalHeight}px` }}
      className="sticky top-0 z-40 pointer-events-none"
    >
      <div className="pointer-events-auto">{render({ isSticky })}</div>
    </div>
  );
};

export default HeaderSticky;
