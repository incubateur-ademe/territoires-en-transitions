/** Les élaborations remplacées : une collectivité n'arrive qu'avec une seule élaboration. */

import { Dossier } from './dossier';

/** Règle : un seul dossier en élaboration par collectivité, le plus récent. Rend les autres. */
export const listElaborationsRemplacees = (dossiers: readonly Dossier[]) => {
  const enElaborationParCollectivite = new Map<number, Dossier[]>();
  for (const d of dossiers) {
    const collectivite = d.colonnes.collectiviteId;
    if (d.colonnes.status === 'en_elaboration' && collectivite !== null) {
      enElaborationParCollectivite.set(collectivite, [
        ...(enElaborationParCollectivite.get(collectivite) ?? []),
        d,
      ]);
    }
  }

  const remplacees: number[] = [];
  for (const memeCollectivite of enElaborationParCollectivite.values()) {
    const [, ...plusAnciens] = [...memeCollectivite].sort(plusRecentDAbord);
    remplacees.push(...plusAnciens.map((d) => d.tecId));
  }
  return remplacees;
};

/** Du plus récent au plus ancien ; à égalité, par identifiant. */
const plusRecentDAbord = (a: Dossier, b: Dossier) =>
  (b.misAJourLe ?? '').localeCompare(a.misAJourLe ?? '') || b.tecId - a.tecId;
