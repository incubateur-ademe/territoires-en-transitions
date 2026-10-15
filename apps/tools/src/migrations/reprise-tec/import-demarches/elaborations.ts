/** Les élaborations : une seule par collectivité, ni doublon d'un PCAET publié, ni PCAET déjà adopté d'après le suivi. */

import { DemarchePcaetStatusEnum } from '@tet/domain/demarches';
import { Dossier } from './dossier';
import type { Ecart } from './ecarts';

const { EN_ELABORATION, INSTRUIT, PUBLIE } = DemarchePcaetStatusEnum;

/**
 * Règles, dans l'ordre :
 * - un seul dossier en élaboration par collectivité, le plus récent ; les autres sont écartés ;
 * - une élaboration créée avant l'adoption d'un PCAET publié de sa collectivité en est le doublon : écartée ;
 * - une élaboration seule, lancée avant l'approbation du suivi ADEME, arrive publiée, datée par le suivi.
 */
export const calculateElaborations = (dossiers: readonly Dossier[]) => {
  const parCollectivite = new Map<number, Dossier[]>();
  for (const d of dossiers) {
    const collectivite = d.colonnes.collectiviteId;
    if (collectivite !== null) {
      parCollectivite.set(collectivite, [
        ...(parCollectivite.get(collectivite) ?? []),
        d,
      ]);
    }
  }

  const remplacees = new Set<number>();
  const doublons = new Set<number>();
  const adoptees = new Map<number, Dossier>();
  for (const memeCollectivite of parCollectivite.values()) {
    const [plusRecente, ...plusAnciennes] = memeCollectivite
      .filter((d) => d.colonnes.status === EN_ELABORATION)
      .sort(plusRecentDAbord);
    plusAnciennes.forEach((d) => remplacees.add(d.tecId));
    if (plusRecente === undefined) {
      continue;
    }
    const autres = memeCollectivite.filter(
      (d) => d.colonnes.status !== EN_ELABORATION
    );
    const creeLe = jour(plusRecente.colonnes.createdAt);
    if (
      autres.some(
        (d) =>
          d.colonnes.status === PUBLIE &&
          creeLe !== null &&
          d.colonnes.adoptedAt !== null &&
          d.colonnes.adoptedAt >= creeLe
      )
    ) {
      doublons.add(plusRecente.tecId);
      continue;
    }
    const approbation = plusRecente.approbationSuivi;
    const lanceLe = jour(plusRecente.colonnes.launchedAt);
    if (
      !autres.some(
        (d) => d.colonnes.status === PUBLIE || d.colonnes.status === INSTRUIT
      ) &&
      approbation !== null &&
      lanceLe !== null &&
      lanceLe <= approbation
    ) {
      adoptees.set(
        plusRecente.tecId,
        publishParLeSuivi(plusRecente, approbation)
      );
    }
  }

  return {
    retenues: dossiers
      .filter((d) => !remplacees.has(d.tecId) && !doublons.has(d.tecId))
      .map((d) => adoptees.get(d.tecId) ?? d),
    ecartees: [
      ...[...remplacees].map(
        (id): Ecart => ({ id, motif: 'elaboration_remplacee' })
      ),
      ...[...doublons].map(
        (id): Ecart => ({ id, motif: 'elaboration_doublon' })
      ),
    ],
    adoptees: [...adoptees.values()],
  };
};

const publishParLeSuivi = (d: Dossier, approbation: string): Dossier => ({
  ...d,
  sources: { ...d.sources, adoption: 'suivi' },
  colonnes: {
    ...d.colonnes,
    status: PUBLIE,
    publishedAt: approbation,
    adoptedAt: approbation,
  },
});

const jour = (date: string | null) =>
  date === null ? null : date.slice(0, 10);

/** Du plus récent au plus ancien ; à égalité, par identifiant. */
const plusRecentDAbord = (a: Dossier, b: Dossier) =>
  (b.misAJourLe ?? '').localeCompare(a.misAJourLe ?? '') || b.tecId - a.tecId;
