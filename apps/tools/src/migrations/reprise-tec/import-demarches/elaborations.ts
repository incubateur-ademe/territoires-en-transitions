/** Les élaborations : une collectivité n'arrive qu'avec une seule élaboration, la plus récente. */

import { DemarchePcaetStatusEnum } from '@tet/domain/demarches';
import { Dossier } from './dossier';
import type { Ecart } from './ecarts';

/** Règle : un seul dossier en élaboration par collectivité, le plus récent ; les autres sont écartés. */
export const calculateElaborations = (dossiers: readonly Dossier[]) => {
  const enElaborationParCollectivite = new Map<number, Dossier[]>();
  for (const d of dossiers) {
    const collectivite = d.colonnes.collectiviteId;
    if (
      d.colonnes.status === DemarchePcaetStatusEnum.EN_ELABORATION &&
      collectivite !== null
    ) {
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
  return {
    retenus: dossiers.filter((d) => !remplacees.includes(d.tecId)),
    ecartees: remplacees.map(
      (id): Ecart => ({ id, motif: 'elaboration_remplacee' })
    ),
  };
};

/** Du plus récent au plus ancien ; à égalité, par identifiant. */
const plusRecentDAbord = (a: Dossier, b: Dossier) =>
  (b.misAJourLe ?? '').localeCompare(a.misAJourLe ?? '') || b.tecId - a.tecId;
