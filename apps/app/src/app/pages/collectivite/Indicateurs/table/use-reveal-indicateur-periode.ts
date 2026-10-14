import {
  IndicateurPeriodes,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import { useEffect, useRef, type RefObject } from 'react';

/** Reveal only an explicitly requested period, once its refreshed column exists. */
export const useRevealIndicateurPeriode = (
  scrollRef: RefObject<HTMLDivElement | null>,
  periode: IndicateurPeriode | undefined,
  visiblePeriodes: readonly IndicateurPeriode[]
) => {
  const revealedPeriode = useRef<IndicateurPeriode | undefined>(undefined);

  useEffect(() => {
    const viewport = scrollRef.current;
    if (!viewport || !periode || revealedPeriode.current === periode) return;
    const cell = viewport.querySelector<HTMLElement>(
      `[data-periode="${periode.dateDebut}"][data-periodicite="${periode.periodicite}"]`
    );
    if (
      !cell ||
      !visiblePeriodes.some(
        (item) =>
          IndicateurPeriodes.key(item) === IndicateurPeriodes.key(periode)
      )
    )
      return;

    const viewportRect = viewport.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();
    const pinnedWidth =
      viewport
        .querySelector<HTMLElement>('[data-pinned="right"]')
        ?.getBoundingClientRect().width ?? 0;
    const availableWidth = viewport.clientWidth - pinnedWidth;
    // Center within the unobscured area, including when inserted in the middle.
    const left =
      viewport.scrollLeft +
      cellRect.left -
      viewportRect.left -
      viewport.clientLeft -
      Math.max(0, (availableWidth - cellRect.width) / 2);
    viewport.scrollTo({
      left: Math.max(
        0,
        Math.min(left, viewport.scrollWidth - viewport.clientWidth)
      ),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
    revealedPeriode.current = periode;
  }, [scrollRef, periode, visiblePeriodes]);
};
