/**
 * Outils purs des démos scénarisées. Une démo se décrit en « temps de scène » :
 * l'instant où chaque chose se produit. Le « temps réel » de lecture y ajoute
 * des pauses, pour laisser le temps de lire un écran terminé.
 */

export type Timeline = {
  /** Durée réelle d'une boucle, pauses comprises, en secondes. */
  duration: number;
  toScene: (realTime: number) => number;
  toReal: (sceneTime: number) => number;
};

export const createTimeline = ({
  duration,
  holds,
  holdDuration,
}: {
  duration: number;
  /** Instants de scène, croissants, où la lecture marque une pause. */
  holds: readonly number[];
  holdDuration: number;
}): Timeline => ({
  duration,
  toScene: (realTime) => {
    let offset = 0;
    for (const hold of holds) {
      const realStart = hold + offset;
      if (realTime < realStart) break;
      if (realTime < realStart + holdDuration) return hold;
      offset += holdDuration;
    }
    return realTime - offset;
  },
  toReal: (sceneTime) => {
    let offset = 0;
    for (const hold of holds) {
      if (sceneTime <= hold) break;
      offset += holdDuration;
    }
    return sceneTime + offset;
  },
});

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const isBetween = (time: number, start: number, end: number) =>
  time >= start && time < end;

/** Avancement de 0 à 1 d'une action qui commence à `start` et dure `duration`. */
export const getProgress = (time: number, start: number, duration: number) =>
  clamp((time - start) / duration, 0, 1);

/** Dernier jalon atteint (jalons triés par instant). */
export const getCurrentKeyframe = <T extends { at: number }>(
  keyframes: readonly T[],
  time: number
): T =>
  keyframes.reduce(
    (current, keyframe) => (time >= keyframe.at ? keyframe : current),
    keyframes[0]
  );
