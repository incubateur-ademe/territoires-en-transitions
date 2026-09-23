import { Dossier } from './dossier';

/** Règle : un seul dossier en élaboration par collectivité, le plus récent. Rend les autres. */
export const listElaborationsRemplacees = (dossiers: readonly Dossier[]) => {
  const enElaborationParCollectivite = new Map<number | null, Dossier[]>();
  for (const d of dossiers) {
    if (d.colonnes.status === 'en_elaboration') {
      const collectivite = d.colonnes.collectiviteId;
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
