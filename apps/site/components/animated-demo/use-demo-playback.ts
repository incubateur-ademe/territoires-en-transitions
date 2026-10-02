'use client';

import { RefObject, useEffect, useRef, useState } from 'react';
import { useIntersection, useMedia } from 'react-use';
import { clamp } from './timeline';

/** Au-delà, un onglet resté en arrière-plan ferait un bond dans la démo. */
const MAX_STEP_SECONDS = 0.2;

/** Assez fin pour les chiffres qui défilent, sans rendre la scène à chaque image. */
const MIN_RENDER_INTERVAL_SECONDS = 1 / 30;

export type DemoPlayback = ReturnType<typeof useDemoPlayback>;

/**
 * Horloge d'une démo en boucle. Elle n'avance que lorsque la démo est visible.
 * Si l'utilisateur réduit les animations, elle reste figée sur `frozenTime`
 * jusqu'à ce qu'il la manipule.
 */
export const useDemoPlayback = ({
  duration,
  frozenTime,
}: {
  duration: number;
  frozenTime: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useMedia('(prefers-reduced-motion: reduce)', false);
  const intersection = useIntersection(containerRef as RefObject<HTMLElement>, {
    threshold: 0,
  });
  const [time, setTime] = useState(0);
  const [wantsPlayback, setWantsPlayback] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const isFrozen = reducedMotion && !hasInteracted;
  const isPlaying = wantsPlayback && !isFrozen;
  const advances =
    isPlaying && !isScrubbing && (intersection?.isIntersecting ?? false);

  useEffect(() => {
    if (!advances) return;
    let previous = performance.now();
    let pending = 0;
    let frame = requestAnimationFrame(function tick(now) {
      // Le premier horodatage peut précéder `previous` : jamais de pas négatif.
      pending += clamp((now - previous) / 1000, 0, MAX_STEP_SECONDS);
      previous = now;
      if (pending >= MIN_RENDER_INTERVAL_SECONDS) {
        const step = pending;
        pending = 0;
        setTime((current) => (current + step >= duration ? 0 : current + step));
      }
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [advances, duration]);

  /** Première manipulation d'une démo figée : on repart de l'écran figé. */
  const unfreeze = () => {
    if (!isFrozen) return;
    setTime(frozenTime);
    setHasInteracted(true);
  };

  return {
    containerRef,
    time: isFrozen ? frozenTime : time,
    duration,
    isPlaying,
    isScrubbing,
    togglePlayback: () => {
      if (isFrozen) {
        unfreeze();
        return;
      }
      setWantsPlayback((playing) => !playing);
    },
    seek: (target: number) => {
      if (isFrozen) {
        setHasInteracted(true);
        setWantsPlayback(false);
      }
      setTime(clamp(target, 0, duration - 0.01));
    },
    startScrubbing: () => setIsScrubbing(true),
    stopScrubbing: () => setIsScrubbing(false),
  };
};
