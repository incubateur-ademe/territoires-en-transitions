/**
 * Règles **pures** dont les évaluateurs de guards ont besoin : pas d'accès
 * base, pas d'utilisateur courant, donc testables et partageables. Ce qui
 * demande une lecture (`dossierComplet`, `documentsAvalComplets`…) est calculé
 * côté serveur, à partir de ce qu'il a lu.
 */

/** Délai légal laissé aux instances consultatives pour rendre leurs avis. */
export const DEMARCHE_PCAET_DELAI_AVIS_MOIS = 3;

/**
 * Échéance de remise des avis pour une transmission donnée — ce que le guard
 * `delaiAvisEcoule` compare à maintenant. Figée en base à la transmission : si
 * le délai légal change, les dossiers déjà transmis gardent l'échéance qui
 * s'appliquait à eux.
 */
export const computeAvisDeadline = (transmittedAt: Date): Date => {
  const deadline = new Date(transmittedAt);
  // Calendrier UTC : même échéance quel que soit le fuseau du serveur.
  deadline.setUTCMonth(deadline.getUTCMonth() + DEMARCHE_PCAET_DELAI_AVIS_MOIS);
  return deadline;
};

/**
 * Règle du guard `estPilote` : l'utilisateur est pilote de la démarche —
 * fallback : si la démarche n'a aucun pilote à compte utilisateur, tout éditeur
 * est autorisé.
 */
export const isDemarchePcaetPilote = (
  userId: string,
  pilotes: readonly { userId?: string | null }[]
): boolean => {
  const userPilotes = pilotes.filter((pilote) => pilote.userId);
  return (
    userPilotes.length === 0 ||
    userPilotes.some((pilote) => pilote.userId === userId)
  );
};
