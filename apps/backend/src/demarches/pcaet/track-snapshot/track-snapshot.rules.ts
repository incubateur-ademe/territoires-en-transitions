import {
  evaluateTransitions,
  type DemandeAvisAchevement,
  type DemarchePcaetGuardResults,
  type DemarchePcaetStatus,
} from '@tet/domain/demarches';

/**
 * Ce qui retient chaque transition encore atteignable depuis le statut. Sans
 * acteur, « être pilote » n'a pas de sens : ce guard est écarté, il ne dit
 * rien de l'état du dossier.
 */
export const listBlocagesDossier = (
  status: DemarchePcaetStatus,
  guardResults: DemarchePcaetGuardResults
): { transitionsAtteignables: string[]; bloquePar: string[] } => {
  const evaluations = Object.entries(evaluateTransitions(status, guardResults));
  const atteignables = evaluations.filter(([, { reachable }]) => reachable);
  return {
    transitionsAtteignables: atteignables.map(([name]) => name).sort(),
    bloquePar: [
      ...new Set(
        atteignables.flatMap(([, { blockedBy }]) =>
          blockedBy.filter((guard) => guard !== 'estPilote')
        )
      ),
    ].sort(),
  };
};

/** Avis attendus et rendus sur l'ensemble des saisines du dossier. */
export const countAvis = (
  demandes: readonly DemandeAvisAchevement[]
): { avisAttendus: number; avisRendus: number; nbSaisines: number } => ({
  nbSaisines: demandes.length,
  avisAttendus: demandes.reduce(
    (total, { titresAttendus }) => total + titresAttendus.length,
    0
  ),
  avisRendus: demandes.reduce(
    (total, { titresAttendus, titresValides }) =>
      total +
      titresAttendus.filter((titre) => titresValides.includes(titre)).length,
    0
  ),
});
