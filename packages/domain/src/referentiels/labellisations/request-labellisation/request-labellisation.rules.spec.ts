import { Etoile } from '../labellisation-etoile.enum.schema';
import { ObjetPreuveEnum } from '../objet-preuve.enum.schema';
import {
  ParcoursLabellisationForRequest,
  canRequestAuditOrLabellisation,
  getParcoursLabellisationStatus,
} from './request-labellisation.rules';
import { RequestLabellisationRulesErrorsEnum } from './request-labellisation.rules-errors';

type DemandeEtOuAudit = NonNullable<
  Parameters<typeof getParcoursLabellisationStatus>[0]
>;

const baseParcours: ParcoursLabellisationForRequest = {
  status: 'non_demandee',
  completudeOk: true,
  critereScore: {
    atteint: true,
    scoreARealiser: 0.5,
    scoreFait: 0.6,
  } as ParcoursLabellisationForRequest['critereScore'],
  isCot: false,
  referentiel: 'cae',
  referentRolesDefined: { eluReferent: true, referentTechnique: true },
  etoiles: 1 as Etoile,
  conditionFichiers: { preuveNombre: 1 },
  labellisation: null,
  preuvesObjets: [
    { objet: ObjetPreuveEnum.ACTE_ENGAGEMENT },
    { objet: ObjetPreuveEnum.CANDIDATURE },
  ],
  criteresAction: [{ atteint: true, actionId: 'cae_1.1.1' }],
};

describe('canRequestAuditOrLabellisation — sujet et étoile demandée', () => {
  const parcoursCot: ParcoursLabellisationForRequest = {
    ...baseParcours,
    isCot: true,
  };

  it('refuse une étoile sur un audit COT, qui ne porte pas de labellisation', () => {
    expect(canRequestAuditOrLabellisation(parcoursCot, 'cot', 1)).toEqual({
      canRequest: false,
      reason:
        RequestLabellisationRulesErrorsEnum.ETOILE_NOT_ALLOWED_FOR_AUDIT_ONLY,
    });
  });

  it("refuse un audit COT à une collectivité qui n'est pas en COT", () => {
    expect(canRequestAuditOrLabellisation(baseParcours, 'cot', null)).toEqual({
      canRequest: false,
      reason:
        RequestLabellisationRulesErrorsEnum.AUDIT_COT_NOT_ALLOWED_FOR_COLLECTIVITE_NOT_COT,
    });
  });

  it("refuse une labellisation COT à une collectivité qui n'est pas en COT", () => {
    expect(
      canRequestAuditOrLabellisation(baseParcours, 'labellisation_cot', 1)
    ).toEqual({
      canRequest: false,
      reason:
        RequestLabellisationRulesErrorsEnum.AUDIT_COT_NOT_ALLOWED_FOR_COLLECTIVITE_NOT_COT,
    });
  });

  it('refuse une labellisation sans étoile demandée', () => {
    expect(
      canRequestAuditOrLabellisation(baseParcours, 'labellisation', null)
    ).toEqual({
      canRequest: false,
      reason:
        RequestLabellisationRulesErrorsEnum.MISSING_ETOILE_FOR_LABELLISATION,
    });
  });

  it('refuse une labellisation COT sans étoile demandée', () => {
    expect(
      canRequestAuditOrLabellisation(parcoursCot, 'labellisation_cot', null)
    ).toEqual({
      canRequest: false,
      reason:
        RequestLabellisationRulesErrorsEnum.MISSING_ETOILE_FOR_LABELLISATION,
    });
  });
});

describe('canRequestAuditOrLabellisation — état du parcours', () => {
  it('refuse une demande déjà envoyée', () => {
    expect(
      canRequestAuditOrLabellisation(
        { ...baseParcours, status: 'demande_envoyee' },
        'labellisation',
        1
      )
    ).toEqual({
      canRequest: false,
      reason: RequestLabellisationRulesErrorsEnum.AUDIT_ALREADY_REQUESTED,
    });
  });

  it("refuse tant que le référentiel n'est pas entièrement rempli", () => {
    expect(
      canRequestAuditOrLabellisation(
        { ...baseParcours, completudeOk: false, isCot: true },
        'cot',
        null
      )
    ).toEqual({
      canRequest: false,
      reason: RequestLabellisationRulesErrorsEnum.REFERENTIEL_NOT_COMPLETED,
    });
  });

  it('accepte un audit COT sur un référentiel rempli et non encore demandé', () => {
    expect(
      canRequestAuditOrLabellisation(
        { ...baseParcours, isCot: true },
        'cot',
        null
      )
    ).toEqual({ canRequest: true, reason: null });
  });
});

describe('canRequestAuditOrLabellisation — pieces attendues par etoile demandee', () => {
  const acteSeulDepose: ParcoursLabellisationForRequest = {
    ...baseParcours,
    critereScore: {
      ...baseParcours.critereScore,
      scoreFait: 0.6,
    },
    preuvesObjets: [{ objet: ObjetPreuveEnum.ACTE_ENGAGEMENT }],
  };

  it('autorise la premiere etoile avec le seul acte, meme si le score permet la labellisation', () => {
    expect(
      canRequestAuditOrLabellisation(acteSeulDepose, 'labellisation', 1)
    ).toEqual({ canRequest: true, reason: null });
  });

  it('refuse la deuxieme etoile tant que le dossier de candidature manque', () => {
    expect(
      canRequestAuditOrLabellisation(acteSeulDepose, 'labellisation', 2)
    ).toEqual({
      canRequest: false,
      reason: RequestLabellisationRulesErrorsEnum.MISSING_FILE,
    });
  });

  it('refuse la premiere etoile quand seul le dossier de candidature est depose', () => {
    expect(
      canRequestAuditOrLabellisation(
        {
          ...acteSeulDepose,
          preuvesObjets: [{ objet: ObjetPreuveEnum.CANDIDATURE }],
        },
        'labellisation',
        1
      )
    ).toEqual({
      canRequest: false,
      reason: RequestLabellisationRulesErrorsEnum.MISSING_FILE,
    });
  });

  it("refuse la demande quand aucun document n'est déposé", () => {
    expect(
      canRequestAuditOrLabellisation(
        {
          ...baseParcours,
          conditionFichiers: { preuveNombre: 0 },
          preuvesObjets: [],
        },
        'labellisation',
        1
      )
    ).toEqual({
      canRequest: false,
      reason: RequestLabellisationRulesErrorsEnum.MISSING_FILE,
    });
  });

  it("dispense la première étoile d'une collectivité COT de tout document", () => {
    expect(
      canRequestAuditOrLabellisation(
        {
          ...baseParcours,
          isCot: true,
          conditionFichiers: { preuveNombre: 0 },
          preuvesObjets: [],
        },
        'labellisation_cot',
        1
      )
    ).toEqual({ canRequest: true, reason: null });
  });

  it('dispense aussi la première étoile demandée sans mention du COT', () => {
    expect(
      canRequestAuditOrLabellisation(
        {
          ...baseParcours,
          isCot: true,
          conditionFichiers: { preuveNombre: 0 },
          preuvesObjets: [],
        },
        'labellisation',
        1
      )
    ).toEqual({ canRequest: true, reason: null });
  });
});

describe("canRequestAuditOrLabellisation — documents deposes depuis l'ancien ecran", () => {
  const parcoursSansObjet: ParcoursLabellisationForRequest = {
    ...baseParcours,
    conditionFichiers: { preuveNombre: 1 },
    preuvesObjets: [{ objet: null }],
  };

  it('refuse la demande par defaut', () => {
    expect(
      canRequestAuditOrLabellisation(parcoursSansObjet, 'labellisation', 1)
    ).toEqual({
      canRequest: false,
      reason: RequestLabellisationRulesErrorsEnum.MISSING_FILE,
    });
  });

  it("autorise la demande quand l'appelant tolere les documents sans objet", () => {
    expect(
      canRequestAuditOrLabellisation(parcoursSansObjet, 'labellisation', 1, {
        allowLegacyDocuments: true,
      })
    ).toEqual({ canRequest: true, reason: null });
  });

  it('refuse la demande sans aucun document, meme avec la tolerance', () => {
    expect(
      canRequestAuditOrLabellisation(
        {
          ...baseParcours,
          conditionFichiers: { preuveNombre: 0 },
          preuvesObjets: [],
        },
        'labellisation',
        1,
        { allowLegacyDocuments: true }
      )
    ).toEqual({
      canRequest: false,
      reason: RequestLabellisationRulesErrorsEnum.MISSING_FILE,
    });
  });
});

describe("canRequestAuditOrLabellisation — plafond d'étoile dérivé du score réalisé", () => {
  it('autorise une étoile au-delà des étoiles obtenues quand le score réalisé le permet', () => {
    expect(
      canRequestAuditOrLabellisation(baseParcours, 'labellisation', 2)
    ).toEqual({ canRequest: true, reason: null });
  });

  it('se base sur le score réalisé et non sur le flag critereScore.atteint', () => {
    expect(
      canRequestAuditOrLabellisation(
        {
          ...baseParcours,
          critereScore: { ...baseParcours.critereScore, atteint: false },
        },
        'labellisation',
        1
      )
    ).toEqual({ canRequest: true, reason: null });
  });

  it('refuse une étoile au-delà du plafond autorisé par le score réalisé', () => {
    expect(
      canRequestAuditOrLabellisation(
        {
          ...baseParcours,
          critereScore: { ...baseParcours.critereScore, scoreFait: 0.35 },
        },
        'labellisation',
        3
      )
    ).toEqual({
      canRequest: false,
      reason: 'SCORE_GLOBAL_CRITERIA_NOT_SATISFIED',
    });
  });

  it('autorise la première étoile quel que soit le score réalisé (seuil 0 %)', () => {
    expect(
      canRequestAuditOrLabellisation(
        {
          ...baseParcours,
          critereScore: { ...baseParcours.critereScore, scoreFait: 0.3 },
        },
        'labellisation',
        1
      )
    ).toEqual({ canRequest: true, reason: null });
  });

  it('autorise la 4e étoile à 68 % de score réalisé (seuil 65 %)', () => {
    expect(
      canRequestAuditOrLabellisation(
        {
          ...baseParcours,
          critereScore: { ...baseParcours.critereScore, scoreFait: 0.68 },
        },
        'labellisation',
        4
      )
    ).toEqual({ canRequest: true, reason: null });
  });

  it('refuse la 5e étoile à 68 % de score réalisé', () => {
    expect(
      canRequestAuditOrLabellisation(
        {
          ...baseParcours,
          critereScore: { ...baseParcours.critereScore, scoreFait: 0.68 },
        },
        'labellisation',
        5
      )
    ).toEqual({
      canRequest: false,
      reason:
        RequestLabellisationRulesErrorsEnum.SCORE_GLOBAL_CRITERIA_NOT_SATISFIED,
    });
  });
});

describe('canRequestAuditOrLabellisation — critères action', () => {
  it("refuse la demande quand un critère action n'est pas atteint", () => {
    expect(
      canRequestAuditOrLabellisation(
        {
          ...baseParcours,
          criteresAction: [
            { atteint: true, actionId: 'cae_1.1.1' },
            { atteint: false, actionId: 'cae_1.1.2' },
          ],
        },
        'labellisation',
        1
      )
    ).toEqual({
      canRequest: false,
      reason:
        RequestLabellisationRulesErrorsEnum.SCORE_ACTIONS_CRITERIA_NOT_SATISFIED,
    });
  });
});

describe('canRequestAuditOrLabellisation — designation des referents', () => {
  const parcoursAvecMesureDeRole: ParcoursLabellisationForRequest = {
    ...baseParcours,
    criteresAction: [{ atteint: true, actionId: 'cae_5.1.2.1.1' }],
  };

  const sansEluReferent = {
    ...parcoursAvecMesureDeRole,
    referentRolesDefined: { eluReferent: false, referentTechnique: true },
  };

  it("refuse la demande quand l'elu referent n'est pas designe", () => {
    expect(
      canRequestAuditOrLabellisation(sansEluReferent, 'labellisation', 1)
    ).toEqual({
      canRequest: false,
      reason: RequestLabellisationRulesErrorsEnum.REFERENT_ROLES_NOT_DEFINED,
    });
  });

  it("accepte un audit COT sans labellisation, qui n'a pas besoin de referents", () => {
    expect(
      canRequestAuditOrLabellisation(
        { ...sansEluReferent, isCot: true },
        'cot',
        null
      )
    ).toEqual({ canRequest: true, reason: null });
  });

  it('accepte la demande une fois les referents designes', () => {
    expect(
      canRequestAuditOrLabellisation(
        parcoursAvecMesureDeRole,
        'labellisation',
        1
      )
    ).toEqual({ canRequest: true, reason: null });
  });
});

describe('getParcoursLabellisationStatus — état consolidé du cycle', () => {
  const auditEnCours: DemandeEtOuAudit['audit'] = {
    valide: false,
    dateDebut: '2026-01-01T00:00:00.000Z',
    dateFin: null,
  };

  it("retourne non_demandee quand il n'y a ni demande ni audit", () => {
    expect(getParcoursLabellisationStatus(null)).toBe('non_demandee');
    expect(getParcoursLabellisationStatus(undefined)).toBe('non_demandee');
    expect(getParcoursLabellisationStatus({ demande: null, audit: null })).toBe(
      'non_demandee'
    );
  });

  it('retourne demande_envoyee quand la demande est envoyee (enCours = false) sans audit demarre', () => {
    expect(
      getParcoursLabellisationStatus({
        demande: { enCours: false },
        audit: null,
      })
    ).toBe('demande_envoyee');
  });

  it("retourne non_demandee tant que la demande est en cours d'edition (enCours = true)", () => {
    expect(
      getParcoursLabellisationStatus({
        demande: { enCours: true },
        audit: null,
      })
    ).toBe('non_demandee');
  });

  it("retourne audit_en_cours quand l'audit a une date de debut et n'est pas valide", () => {
    expect(
      getParcoursLabellisationStatus({ demande: null, audit: auditEnCours })
    ).toBe('audit_en_cours');
  });

  it("retourne audit_valide quand l'audit est valide", () => {
    expect(
      getParcoursLabellisationStatus({
        demande: null,
        audit: { valide: true, dateDebut: null, dateFin: null },
      })
    ).toBe('audit_valide');
  });

  it("priorise audit_valide sur audit_en_cours quand l'audit demarre est aussi valide", () => {
    expect(
      getParcoursLabellisationStatus({
        demande: null,
        audit: { ...auditEnCours, valide: true },
      })
    ).toBe('audit_valide');
  });

  it("priorise audit_en_cours sur demande_envoyee quand l'audit est demarre", () => {
    expect(
      getParcoursLabellisationStatus({
        demande: { enCours: false },
        audit: auditEnCours,
      })
    ).toBe('audit_en_cours');
  });
});
