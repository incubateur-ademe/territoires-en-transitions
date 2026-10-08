import {
  ReferentielDisplayCriteria,
  shouldDisplayReferentielByCriteria,
} from './compute-referentiel-display.rules';

const now = new Date('2025-06-01T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;
const twoYearsAgo = new Date(now.getTime() - 2 * 365 * DAY_MS);
const moreThanTwoYearsAgo = new Date(now.getTime() - (2 * 365 + 1) * DAY_MS);
const betweenOneAndTwoYearsAgo = new Date(now.getTime() - 500 * DAY_MS);

describe('shouldDisplayReferentielByCriteria', () => {
  it('returns false when 0 criteria are met', () => {
    const criteria: ReferentielDisplayCriteria = {
      actionStatutCount: 10,
      actionCommentaireCount: 10,
      lastActivityAt: moreThanTwoYearsAgo,
    };
    expect(shouldDisplayReferentielByCriteria(criteria, now)).toBe(false);
  });

  it('returns false when 1 criterion is met (50 statuts only)', () => {
    const criteria: ReferentielDisplayCriteria = {
      actionStatutCount: 50,
      actionCommentaireCount: 0,
      lastActivityAt: null,
    };
    expect(shouldDisplayReferentielByCriteria(criteria, now)).toBe(false);
  });

  it('returns false when 1 criterion is met (lastActivity within 2 years only)', () => {
    const criteria: ReferentielDisplayCriteria = {
      actionStatutCount: 0,
      actionCommentaireCount: 0,
      lastActivityAt: twoYearsAgo,
    };
    expect(shouldDisplayReferentielByCriteria(criteria, now)).toBe(false);
  });

  it('returns true when exactly 2 criteria are met (50 statuts + 50 commentaires)', () => {
    const criteria: ReferentielDisplayCriteria = {
      actionStatutCount: 50,
      actionCommentaireCount: 50,
      lastActivityAt: null,
    };
    expect(shouldDisplayReferentielByCriteria(criteria, now)).toBe(true);
  });

  it('returns true when exactly 2 criteria are met (50 statuts + recent activity)', () => {
    const criteria: ReferentielDisplayCriteria = {
      actionStatutCount: 50,
      actionCommentaireCount: 0,
      lastActivityAt: twoYearsAgo,
    };
    expect(shouldDisplayReferentielByCriteria(criteria, now)).toBe(true);
  });

  it('counts an activity between 1 and 2 years old as recent', () => {
    const criteria: ReferentielDisplayCriteria = {
      actionStatutCount: 50,
      actionCommentaireCount: 0,
      lastActivityAt: betweenOneAndTwoYearsAgo,
    };
    expect(shouldDisplayReferentielByCriteria(criteria, now)).toBe(true);
  });

  it('does not count an activity more than 2 years old as recent', () => {
    const criteria: ReferentielDisplayCriteria = {
      actionStatutCount: 50,
      actionCommentaireCount: 0,
      lastActivityAt: moreThanTwoYearsAgo,
    };
    expect(shouldDisplayReferentielByCriteria(criteria, now)).toBe(false);
  });

  it('returns true when all 5 criteria are met', () => {
    const criteria: ReferentielDisplayCriteria = {
      actionStatutCount: 200,
      actionCommentaireCount: 200,
      lastActivityAt: twoYearsAgo,
    };
    expect(shouldDisplayReferentielByCriteria(criteria, now)).toBe(true);
  });

  it('returns false when lastActivityAt is null and only count criteria could apply', () => {
    const criteria: ReferentielDisplayCriteria = {
      actionStatutCount: 49,
      actionCommentaireCount: 49,
      lastActivityAt: null,
    };
    expect(shouldDisplayReferentielByCriteria(criteria, now)).toBe(false);
  });

  it('returns false when lastActivityAt is more than 2 years old and counts are low', () => {
    const criteria: ReferentielDisplayCriteria = {
      actionStatutCount: 49,
      actionCommentaireCount: 49,
      lastActivityAt: moreThanTwoYearsAgo,
    };
    expect(shouldDisplayReferentielByCriteria(criteria, now)).toBe(false);
  });
});
