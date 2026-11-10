/** Durée totale visée du balayage, quel que soit le nombre de lignes. */
const SWEEP_TOTAL_MS = 1200;
const ROW_DURATION_MS = 350;
const MAX_ROW_DELAY_MS = 30;

/**
 * Effet « balayage » après un remplissage de démo : les lignes des tableaux
 * apparaissent de haut en bas. Rien ne bouge pour qui a demandé moins
 * d'animations.
 */
export const sweepRows = (container: Element | null): void => {
  if (
    !container ||
    typeof window === 'undefined' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }
  const rows = Array.from(container.querySelectorAll('tbody tr'));
  const step = Math.min(
    MAX_ROW_DELAY_MS,
    (SWEEP_TOTAL_MS - ROW_DURATION_MS) / Math.max(rows.length, 1)
  );
  rows.forEach((row, index) => {
    row.animate(
      [
        { opacity: 0.15, transform: 'translateX(-8px)' },
        { opacity: 1, transform: 'none' },
      ],
      {
        duration: ROW_DURATION_MS,
        delay: index * step,
        easing: 'ease-out',
        fill: 'backwards',
      }
    );
  });
};
