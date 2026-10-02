'use client';

import { useEffect, useRef, useState } from 'react';
import { borner } from './timeline';

/** Au-delà, un onglet resté en arrière-plan ferait un bond dans la démo. */
const PAS_MAX_SECONDES = 0.2;

export type LectureDemo = ReturnType<typeof useLectureDemo>;

/**
 * Horloge d'une démo en boucle. Elle avance seulement quand la démo est
 * visible, et se fige sur `instantFixe` si l'utilisateur réduit les animations.
 */
export const useLectureDemo = ({
  duree,
  instantFixe,
}: {
  duree: number;
  /** Instant affiché, en pause, quand les animations sont réduites. */
  instantFixe: number;
}) => {
  const conteneur = useRef<HTMLDivElement>(null);
  const [temps, setTemps] = useState(0);
  const [enLecture, setEnLecture] = useState(true);
  const [deplacement, setDeplacement] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const requete = window.matchMedia('(prefers-reduced-motion: reduce)');
    const synchroniser = () => {
      if (!requete.matches) return;
      setTemps(instantFixe);
      setEnLecture(false);
    };
    synchroniser();
    requete.addEventListener('change', synchroniser);
    return () => requete.removeEventListener('change', synchroniser);
  }, [instantFixe]);

  useEffect(() => {
    const element = conteneur.current;
    if (!element) return;
    const observateur = new IntersectionObserver(([entree]) =>
      setVisible(entree.isIntersecting)
    );
    observateur.observe(element);
    return () => observateur.disconnect();
  }, []);

  const avance = enLecture && !deplacement && visible;

  useEffect(() => {
    if (!avance) return;
    let precedent = performance.now();
    let image = requestAnimationFrame(function tic(maintenant) {
      const pas = Math.min((maintenant - precedent) / 1000, PAS_MAX_SECONDES);
      precedent = maintenant;
      setTemps((courant) => (courant + pas >= duree ? 0 : courant + pas));
      image = requestAnimationFrame(tic);
    });
    return () => cancelAnimationFrame(image);
  }, [avance, duree]);

  return {
    conteneur,
    temps,
    duree,
    enLecture,
    deplacement,
    basculerLecture: () => setEnLecture((lecture) => !lecture),
    allerA: (instant: number) => setTemps(borner(instant, 0, duree - 0.01)),
    commencerDeplacement: () => setDeplacement(true),
    terminerDeplacement: () => setDeplacement(false),
  };
};
