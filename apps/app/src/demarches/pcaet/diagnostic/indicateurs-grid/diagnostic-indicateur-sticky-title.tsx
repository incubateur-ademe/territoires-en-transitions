'use client';

import { JSX, ReactNode, useEffect, useRef, useState } from 'react';

type Props = {
  title: string;
  unit?: string;
  children: ReactNode;
};

/**
 * La grille défile dans son propre cadre (les années débordent en largeur) :
 * son `<thead>` ne peut donc pas se figer sur la page. Quand la page fait
 * sortir l'en-tête de l'écran alors que des lignes restent visibles, ce
 * bandeau rappelle de quel indicateur il s'agit.
 */
export const DiagnosticIndicateurStickyTitle = ({
  title,
  unit,
  children,
}: Props): JSX.Element => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const head = section.querySelector('thead');
      if (!head) return;
      const bannerHeight = bannerRef.current?.offsetHeight ?? 0;
      setIsVisible(
        head.getBoundingClientRect().bottom <= 0 &&
          section.getBoundingClientRect().bottom > bannerHeight
      );
    };
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    // Capture : la page peut défiler dans un conteneur plutôt que la fenêtre.
    window.addEventListener('scroll', onScroll, {
      capture: true,
      passive: true,
    });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={sectionRef} className="relative">
      <div className="sticky top-0 z-50 h-0">
        <div
          ref={bannerRef}
          aria-hidden
          data-test="demarches.pcaet.diagnostic.indicateur-sticky-title"
          className={[
            'absolute inset-x-0 top-0 rounded-b-lg border border-t-0 border-grey-3 bg-white px-4 py-2 shadow-sm transition-opacity',
            isVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
          ].join(' ')}
        >
          <span className="font-bold text-primary-9">{title}</span>
          {unit && <span className="text-sm text-grey-8">{` (${unit})`}</span>}
        </div>
      </div>
      {children}
    </div>
  );
};
