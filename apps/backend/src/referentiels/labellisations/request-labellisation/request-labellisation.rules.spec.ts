import {
  canRequestAuditOrLabellisation,
  Etoile,
  ParcoursLabellisationForRequest,
  RequestLabellisationRulesErrorsEnum,
} from '@tet/domain/referentiels';

const createParcours = (
  overrides: Partial<ParcoursLabellisationForRequest> = {}
): ParcoursLabellisationForRequest => ({
  status: 'non_demandee',
  completude_ok: true,
  etoiles: 1,
  critere_score: {
    atteint: true,
    etoiles: 1,
    score_fait: 0.5,
    score_a_realiser: 0.5,
  },
  criteres_action: [
    {
      atteint: true,
    },
  ],
  conditionFichiers: { atteint: true },
  isCot: false,
  ...overrides,
});

describe('canRequestAuditOrLabellisation', () => {
  it('returns ETOILE_NOT_ALLOWED_FOR_AUDIT_ONLY when sujet is cot and etoiles is set', () => {
    const result = canRequestAuditOrLabellisation(
      createParcours(),
      'cot',
      1 as Etoile
    );
    expect(result.canRequest).toBe(false);
    expect(result.reason).toBe(
      RequestLabellisationRulesErrorsEnum.ETOILE_NOT_ALLOWED_FOR_AUDIT_ONLY
    );
  });

  it('returns AUDIT_COT_NOT_ALLOWED_FOR_COLLECTIVITE_NOT_COT when sujet is cot and collectivite is not COT', () => {
    const result = canRequestAuditOrLabellisation(
      createParcours(),
      'cot',
      null
    );
    expect(result.canRequest).toBe(false);
    expect(result.reason).toBe(
      RequestLabellisationRulesErrorsEnum.AUDIT_COT_NOT_ALLOWED_FOR_COLLECTIVITE_NOT_COT
    );
  });

  it('returns AUDIT_COT_NOT_ALLOWED_FOR_COLLECTIVITE_NOT_COT when sujet is labellisation_cot and collectivite is not COT', () => {
    const result = canRequestAuditOrLabellisation(
      createParcours(),
      'labellisation_cot',
      1
    );
    expect(result.canRequest).toBe(false);
    expect(result.reason).toBe(
      RequestLabellisationRulesErrorsEnum.AUDIT_COT_NOT_ALLOWED_FOR_COLLECTIVITE_NOT_COT
    );
  });

  it('returns MISSING_ETOILE_FOR_LABELLISATION when sujet is labellisation and etoiles is null', () => {
    const result = canRequestAuditOrLabellisation(
      createParcours(),
      'labellisation',
      null
    );
    expect(result.canRequest).toBe(false);
    expect(result.reason).toBe(
      RequestLabellisationRulesErrorsEnum.MISSING_ETOILE_FOR_LABELLISATION
    );
  });

  it('returns MISSING_ETOILE_FOR_LABELLISATION when sujet is labellisation_cot and etoiles is null', () => {
    const result = canRequestAuditOrLabellisation(
      createParcours({ isCot: true }),
      'labellisation_cot',
      null
    );
    expect(result.canRequest).toBe(false);
    expect(result.reason).toBe(
      RequestLabellisationRulesErrorsEnum.MISSING_ETOILE_FOR_LABELLISATION
    );
  });

  it('returns AUDIT_ALREADY_REQUESTED when status is not non_demandee for labellisation etoile >= 2', () => {
    const result = canRequestAuditOrLabellisation(
      createParcours({ status: 'demande_envoyee', etoiles: 2 }),
      'labellisation',
      2 as Etoile
    );
    expect(result.canRequest).toBe(false);
    expect(result.reason).toBe(
      RequestLabellisationRulesErrorsEnum.AUDIT_ALREADY_REQUESTED
    );
  });

  it('refuse une labellisation 1ère étoile quand un autre cycle est en cours (un seul cycle à la fois)', () => {
    const result = canRequestAuditOrLabellisation(
      createParcours({ status: 'audit_en_cours' }),
      'labellisation',
      1 as Etoile
    );
    expect(result).toEqual({
      canRequest: false,
      reason: RequestLabellisationRulesErrorsEnum.AUDIT_ALREADY_REQUESTED,
    });
  });

  it('returns REFERENTIEL_NOT_COMPLETED when completude_ok is false', () => {
    const result = canRequestAuditOrLabellisation(
      createParcours({ completude_ok: false, isCot: true }),
      'cot',
      null
    );
    expect(result.canRequest).toBe(false);
    expect(result.reason).toBe(
      RequestLabellisationRulesErrorsEnum.REFERENTIEL_NOT_COMPLETED
    );
  });

  it('returns canRequest true for cot (audit only) when completude ok and non_demandee', () => {
    const result = canRequestAuditOrLabellisation(
      createParcours({ isCot: true }),
      'cot',
      null
    );
    expect(result.canRequest).toBe(true);
    expect(result.reason).toBeNull();
  });

  it('returns SCORE_GLOBAL_CRITERIA_NOT_SATISFIED when requested etoiles is greater than the score-eligible star', () => {
    const result = canRequestAuditOrLabellisation(
      createParcours({
        critere_score: {
          atteint: false,
          etoiles: 1,
          score_fait: 0.3,
          score_a_realiser: 0.35,
        },
      }),
      'labellisation',
      2 as Etoile
    );
    expect(result.canRequest).toBe(false);
    expect(result.reason).toBe(
      RequestLabellisationRulesErrorsEnum.SCORE_GLOBAL_CRITERIA_NOT_SATISFIED
    );
  });

  it('autorise une 1ère étoile quel que soit le score réalisé (seuil 0%)', () => {
    const result = canRequestAuditOrLabellisation(
      createParcours({
        critere_score: {
          atteint: false,
          etoiles: 1,
          score_fait: 0.3,
          score_a_realiser: 0.35,
        },
      }),
      'labellisation',
      1 as Etoile
    );
    expect(result).toEqual({ canRequest: true, reason: null });
  });

  it('autorise une demande 4★ quand le score réalisé atteint le seuil 4★ (65%) même si objectif vise la 5★', () => {
    const result = canRequestAuditOrLabellisation(
      createParcours({
        etoiles: 5,
        critere_score: {
          atteint: false,
          etoiles: 5,
          score_fait: 0.68,
          score_a_realiser: 0.75,
        },
      }),
      'labellisation',
      4 as Etoile
    );
    expect(result).toEqual({ canRequest: true, reason: null });
  });

  it('refuse une demande 5★ quand le score réalisé ne permet que la 4ème étoile (68%)', () => {
    const result = canRequestAuditOrLabellisation(
      createParcours({
        etoiles: 5,
        critere_score: {
          atteint: false,
          etoiles: 5,
          score_fait: 0.68,
          score_a_realiser: 0.75,
        },
      }),
      'labellisation',
      5 as Etoile
    );
    expect(result.canRequest).toBe(false);
    expect(result.reason).toBe(
      RequestLabellisationRulesErrorsEnum.SCORE_GLOBAL_CRITERIA_NOT_SATISFIED
    );
  });

  it('returns SCORE_ACTIONS_CRITERIA_NOT_SATISFIED when one critere_action not atteint', () => {
    const result = canRequestAuditOrLabellisation(
      createParcours({
        criteres_action: [
          {
            atteint: true,
          },
          {
            atteint: false,
          },
        ],
      }),
      'labellisation',
      1 as Etoile
    );
    expect(result.canRequest).toBe(false);
    expect(result.reason).toBe(
      RequestLabellisationRulesErrorsEnum.SCORE_ACTIONS_CRITERIA_NOT_SATISFIED
    );
  });

  it('returns MISSING_FILE when labellisation, scores ok, but conditionFichiers not atteint', () => {
    const result = canRequestAuditOrLabellisation(
      createParcours({ conditionFichiers: { atteint: false } }),
      'labellisation',
      1 as Etoile
    );
    expect(result.canRequest).toBe(false);
    expect(result.reason).toBe(
      RequestLabellisationRulesErrorsEnum.MISSING_FILE
    );
  });

  it('returns canRequest true for labellisation_cot or labellisation 1ère étoile COT without file', () => {
    const result = canRequestAuditOrLabellisation(
      createParcours({
        isCot: true,
        conditionFichiers: { atteint: false },
      }),
      'labellisation_cot',
      1 as Etoile
    );
    expect(result.canRequest).toBe(true);
    expect(result.reason).toBeNull();

    const resultLabellisationOnly = canRequestAuditOrLabellisation(
      createParcours({
        isCot: true,
        conditionFichiers: {
          atteint: false,
        },
      }),
      'labellisation',
      1 as Etoile
    );
    expect(resultLabellisationOnly.canRequest).toBe(true);
    expect(resultLabellisationOnly.reason).toBeNull();
  });

  it('returns canRequest true for labellisation when all criteria met', () => {
    const result = canRequestAuditOrLabellisation(
      createParcours(),
      'labellisation',
      1 as Etoile
    );
    expect(result.canRequest).toBe(true);
    expect(result.reason).toBeNull();
  });
});
