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
    score_fait: 50,
    score_a_realiser: 50,
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

  it('returns AUDIT_ALREADY_REQUESTED when status is not non_demandee', () => {
    const result = canRequestAuditOrLabellisation(
      createParcours({ status: 'demande_envoyee' }),
      'labellisation',
      1 as Etoile
    );
    expect(result.canRequest).toBe(false);
    expect(result.reason).toBe(
      RequestLabellisationRulesErrorsEnum.AUDIT_ALREADY_REQUESTED
    );
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

  it('returns SCORE_GLOBAL_CRITERIA_NOT_SATISFIED when requested etoiles is greater than parcours etoiles', () => {
    const result = canRequestAuditOrLabellisation(
      createParcours({
        critere_score: {
          atteint: false,
          etoiles: 1,
          score_fait: 30,
          score_a_realiser: 50,
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

  it('returns SCORE_GLOBAL_CRITERIA_NOT_SATISFIED when labellisation and critere_score not atteint', () => {
    const result = canRequestAuditOrLabellisation(
      createParcours({
        critere_score: {
          atteint: false,
          etoiles: 1,
          score_fait: 30,
          score_a_realiser: 50,
        },
      }),
      'labellisation',
      1 as Etoile
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
