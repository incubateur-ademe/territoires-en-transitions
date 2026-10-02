/**
 * Outils purs des démos scénarisées. Une démo se décrit en « temps de scène » :
 * l'instant où chaque chose se produit. Le « temps réel » de lecture y ajoute
 * des pauses de lecture, pour laisser le temps de lire un écran terminé.
 */

export type Timeline = {
  /** Durée réelle d'une boucle, pauses comprises, en secondes. */
  duree: number;
  versScene: (tempsReel: number) => number;
  versReel: (tempsScene: number) => number;
};

export const creerTimeline = ({
  duree,
  pauses,
  dureePause,
}: {
  duree: number;
  /** Instants de scène, croissants, où la lecture marque une pause. */
  pauses: readonly number[];
  dureePause: number;
}): Timeline => ({
  duree,
  versScene: (tempsReel) => {
    let decalage = 0;
    for (const pause of pauses) {
      const debutReel = pause + decalage;
      if (tempsReel < debutReel) break;
      if (tempsReel < debutReel + dureePause) return pause;
      decalage += dureePause;
    }
    return tempsReel - decalage;
  },
  versReel: (tempsScene) => {
    let decalage = 0;
    for (const pause of pauses) {
      if (tempsScene <= pause) break;
      decalage += dureePause;
    }
    return tempsScene + decalage;
  },
});

export const borner = (valeur: number, min: number, max: number) =>
  Math.max(min, Math.min(max, valeur));

export const estEntre = (temps: number, debut: number, fin: number) =>
  temps >= debut && temps < fin;

/** Avancement de 0 à 1 d'une action qui commence à `debut` et dure `duree`. */
export const getProgression = (temps: number, debut: number, duree: number) =>
  borner((temps - debut) / duree, 0, 1);

/** Dernier point dont l'instant est atteint (jalons triés par instant). */
export const getJalonCourant = <T extends { instant: number }>(
  jalons: readonly T[],
  temps: number
): T =>
  jalons.reduce(
    (courant, jalon) => (temps >= jalon.instant ? jalon : courant),
    jalons[0]
  );
