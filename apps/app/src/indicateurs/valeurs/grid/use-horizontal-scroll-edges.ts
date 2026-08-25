'use client';

import { RefObject, useEffect, useState } from 'react';

/** Le défilement rend des valeurs fractionnaires : un pixel de tolérance. */
const SCROLL_EPSILON = 1;

export type HorizontalScrollEdges = {
  /** Du contenu est masqué à gauche, sous la colonne de titres. */
  canScrollLeft: boolean;
  /** Du contenu est masqué à droite. */
  canScrollRight: boolean;
};

/**
 * Bords atteints par le défilement horizontal d'une zone : de quoi n'afficher
 * l'ombre d'une colonne figée que du côté où il reste réellement du contenu
 * caché (cf. `scroll-shadow.ts`).
 *
 * La largeur du contenu bouge avec les colonnes d'années : c'est le
 * `ResizeObserver` posé sur la table qui reprend la mesure, l'événement
 * `scroll` ne suffirait pas.
 */
export const useHorizontalScrollEdges = (
  scrollRef: RefObject<HTMLElement | null>
): HorizontalScrollEdges => {
  const [edges, setEdges] = useState<HorizontalScrollEdges>({
    canScrollLeft: false,
    canScrollRight: false,
  });

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    const measure = (): void => {
      const maxScrollLeft = node.scrollWidth - node.clientWidth;
      setEdges({
        canScrollLeft: node.scrollLeft > SCROLL_EPSILON,
        canScrollRight: node.scrollLeft < maxScrollLeft - SCROLL_EPSILON,
      });
    };

    measure();
    node.addEventListener('scroll', measure, { passive: true });

    // jsdom n'implémente pas ResizeObserver : les tests de rendu de la grille
    // se contentent alors de la mesure initiale.
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(measure);
    observer?.observe(node);
    const content = node.firstElementChild;
    if (content !== null) observer?.observe(content);

    return () => {
      node.removeEventListener('scroll', measure);
      observer?.disconnect();
    };
  }, [scrollRef]);

  return edges;
};
