export const ACTION_STATUT_COUNT_THRESHOLD1 = 50;
export const ACTION_COMMENTAIRE_COUNT_THRESHOLD1 = 50;
export const ACTION_STATUT_COUNT_THRESHOLD2 = 150;
export const ACTION_COMMENTAIRE_COUNT_THRESHOLD2 = 150;
export const LAST_ACTIVITY_AGE_MS_THRESHOLD = 365 * 24 * 60 * 60 * 1000;
export const MIN_CRITERIA_COUNT_TO_DISPLAY = 2;

export interface ReferentielDisplayCriteria {
  actionStatutCount: number;
  actionCommentaireCount: number;
  lastActivityAt: Date | null;
}

/**
 * Returns true if at least 2 of the 5 display criteria are met.
 * Used for eci and cae; te is always displayed elsewhere.
 */
export function shouldDisplayReferentielByCriteria(
  criteria: ReferentielDisplayCriteria,
  now: Date = new Date()
): boolean {
  const { actionStatutCount, actionCommentaireCount, lastActivityAt } =
    criteria;

  const criteriaMet = [
    actionStatutCount >= ACTION_STATUT_COUNT_THRESHOLD1,
    actionStatutCount >= ACTION_STATUT_COUNT_THRESHOLD2,
    actionCommentaireCount >= ACTION_COMMENTAIRE_COUNT_THRESHOLD1,
    actionCommentaireCount >= ACTION_COMMENTAIRE_COUNT_THRESHOLD2,
    lastActivityAt !== null &&
      now.getTime() - lastActivityAt.getTime() <=
        LAST_ACTIVITY_AGE_MS_THRESHOLD,
  ].filter(Boolean);

  return criteriaMet.length >= MIN_CRITERIA_COUNT_TO_DISPLAY;
}
