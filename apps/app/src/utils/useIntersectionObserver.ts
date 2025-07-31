import {useEffect, useRef, useState} from 'react';

/**
 * Fournit un moyen d'observer de manière asynchrone les changements
 * d'intersection d'un élément cible avec un élément ancêtre ou avec la fenêtre
 * du document.
 *
 * @param options https://developer.mozilla.org/fr/docs/Web/API/IntersectionObserver#propri%C3%A9t%C3%A9s
 * @returns ref,entry : Appliquer `ref` à l'élément cible et tester
 * `entry?.isIntersecting` pour détecter l'intersection
 *
 * Ref: https://developer.mozilla.org/fr/docs/Web/API/IntersectionObserver
 *      https://usehooks.com/useintersectionobserver
 */
export function useIntersectionObserver(options?: IntersectionObserverInit) {
  const {threshold = 0, root = null, rootMargin = '0%'} = options || {};
  const ref = useRef(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    const node = ref?.current;

    // pas d'élément cible ou API non supportée
    if (!node || typeof IntersectionObserver !== 'function') {
      return;
    }

    // crée l'observateur et le rattache à l'élément cible
    const observer = new IntersectionObserver(([entry]) => setEntry(entry), {
      threshold,
      root,
      rootMargin,
    });
    observer.observe(node);

    // renvoi la fonction de nettoyage
    return () => {
      setEntry(null);
      observer.disconnect();
    };
  }, []);

  return {ref, entry};
}
