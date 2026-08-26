import { describe, expect, it } from 'vitest';
import { SujetDemandeEnum } from '../labellisation-demande.schema';
import { Etoile } from '../labellisation-etoile.enum.schema';
import { ObjetPreuveEnum } from '../objet-preuve.enum.schema';
import { ParcoursForAuditPrerequisites } from '../request-labellisation/request-labellisation.rules';
import {
  AUDIT_TYPES_BY_ASCENDING_REQUIREMENTS,
  listAuditTypeOptions,
} from './audit-type-options.rules';

const makeParcours = (
  overrides: Partial<ParcoursForAuditPrerequisites> = {}
): ParcoursForAuditPrerequisites => ({
  labellisation: null,
  referentiel: 'cae',
  referentRolesDefined: { eluReferent: true, referentTechnique: true },
  completude_ok: true,
  critere_score: {
    atteint: true,
    score_a_realiser: 0.35,
    score_fait: 0.4,
  } as ParcoursForAuditPrerequisites['critere_score'],
  isCot: false,
  etoiles: 2 as Etoile,
  conditionFichiers: { preuve_nombre: 1 },
  preuvesObjets: [
    { objet: ObjetPreuveEnum.ACTE_ENGAGEMENT },
    { objet: ObjetPreuveEnum.CANDIDATURE },
  ],
  criteres_action: [{ atteint: true, action_id: 'cae_1.1.1' }],
  ...overrides,
});

describe('listAuditTypeOptions — quels sujets sont proposés', () => {
  it("COT : l'offre se limite aux deux sujets COT, quel que soit le score", () => {
    expect(
      listAuditTypeOptions(makeParcours({ isCot: true }), {
        isCOT: true,
        maximumRequestableStar: 5,
      }).map((option) => option.sujet)
    ).toEqual([SujetDemandeEnum.COT, SujetDemandeEnum.LABELLISATION_COT]);
  });

  it("non-COT : l'offre se limite à l'audit de labellisation, quel que soit le score", () => {
    expect(
      listAuditTypeOptions(makeParcours(), {
        isCOT: false,
        maximumRequestableStar: 5,
      }).map((option) => option.sujet)
    ).toEqual([SujetDemandeEnum.LABELLISATION]);
  });

  it("COT sous 35 % de score : l'audit COT seul reste demandable, le sujet labellisant non", () => {
    expect(
      listAuditTypeOptions(makeParcours({ isCot: true }), {
        isCOT: true,
        maximumRequestableStar: 1,
      })
    ).toEqual([
      { sujet: SujetDemandeEnum.COT, isRequestable: true, reason: null },
      {
        sujet: SujetDemandeEnum.LABELLISATION_COT,
        isRequestable: false,
        reason: 'SCORE_BELOW_AUDITABLE_STAR',
      },
    ]);
  });

  it('non-COT sous 35 % de score : le seul sujet offert exige une étoile auditable', () => {
    expect(
      listAuditTypeOptions(makeParcours(), {
        isCOT: false,
        maximumRequestableStar: 1,
      })
    ).toEqual([
      {
        sujet: SujetDemandeEnum.LABELLISATION,
        isRequestable: false,
        reason: 'SCORE_BELOW_AUDITABLE_STAR',
      },
    ]);
  });

  it('COT a partir de 35 % de score : les deux sujets COT sont demandables', () => {
    expect(
      listAuditTypeOptions(makeParcours({ isCot: true }), {
        isCOT: true,
        maximumRequestableStar: 2,
      })
    ).toEqual([
      { sujet: SujetDemandeEnum.COT, isRequestable: true, reason: null },
      {
        sujet: SujetDemandeEnum.LABELLISATION_COT,
        isRequestable: true,
        reason: null,
      },
    ]);
  });

  it("non-COT a partir de 35 % de score : l'audit de labellisation est demandable", () => {
    expect(
      listAuditTypeOptions(makeParcours(), {
        isCOT: false,
        maximumRequestableStar: 2,
      })
    ).toEqual([
      {
        sujet: SujetDemandeEnum.LABELLISATION,
        isRequestable: true,
        reason: null,
      },
    ]);
  });
});

describe('listAuditTypeOptions — pourquoi un sujet proposé n est pas demandable', () => {
  it('référentiel incomplet : aucun sujet demandable, tous sur la complétude', () => {
    expect(
      listAuditTypeOptions(
        makeParcours({ isCot: true, completude_ok: false }),
        {
          isCOT: true,
          maximumRequestableStar: 2,
        }
      )
    ).toEqual([
      {
        sujet: SujetDemandeEnum.COT,
        isRequestable: false,
        reason: 'REFERENTIEL_NOT_COMPLETED',
      },
      {
        sujet: SujetDemandeEnum.LABELLISATION_COT,
        isRequestable: false,
        reason: 'REFERENTIEL_NOT_COMPLETED',
      },
    ]);
  });

  it("référents non désignés : l'audit COT seul reste demandable, pas le sujet labellisant", () => {
    expect(
      listAuditTypeOptions(
        makeParcours({
          isCot: true,
          referentRolesDefined: { eluReferent: false, referentTechnique: true },
          criteres_action: [{ atteint: true, action_id: 'cae_5.1.2.1.1' }],
        }),
        { isCOT: true, maximumRequestableStar: 2 }
      )
    ).toEqual([
      { sujet: SujetDemandeEnum.COT, isRequestable: true, reason: null },
      {
        sujet: SujetDemandeEnum.LABELLISATION_COT,
        isRequestable: false,
        reason: 'REFERENT_ROLES_NOT_DEFINED',
      },
    ]);
  });

  it("critère d'action non atteint : l'audit COT seul reste demandable", () => {
    expect(
      listAuditTypeOptions(
        makeParcours({
          isCot: true,
          criteres_action: [
            { atteint: true, action_id: 'cae_1.1.1' },
            { atteint: false, action_id: 'cae_1.1.2' },
          ],
        }),
        { isCOT: true, maximumRequestableStar: 2 }
      )
    ).toEqual([
      { sujet: SujetDemandeEnum.COT, isRequestable: true, reason: null },
      {
        sujet: SujetDemandeEnum.LABELLISATION_COT,
        isRequestable: false,
        reason: 'SCORE_ACTIONS_CRITERIA_NOT_SATISFIED',
      },
    ]);
  });

  it('aucun document de candidature déposé : le sujet labellisant réclame le fichier', () => {
    expect(
      listAuditTypeOptions(
        makeParcours({
          conditionFichiers: { preuve_nombre: 0 },
          preuvesObjets: [],
        }),
        { isCOT: false, maximumRequestableStar: 2 }
      )
    ).toEqual([
      {
        sujet: SujetDemandeEnum.LABELLISATION,
        isRequestable: false,
        reason: 'MISSING_FILE',
      },
    ]);
  });

  it("un document sans objet ne remplace pas les pieces attendues : seul l'audit COT reste demandable", () => {
    expect(
      listAuditTypeOptions(
        makeParcours({
          isCot: true,
          conditionFichiers: { preuve_nombre: 1 },
          preuvesObjets: [],
        }),
        { isCOT: true, maximumRequestableStar: 2 }
      )
    ).toEqual([
      { sujet: SujetDemandeEnum.COT, isRequestable: true, reason: null },
      {
        sujet: SujetDemandeEnum.LABELLISATION_COT,
        isRequestable: false,
        reason: 'MISSING_FILE',
      },
    ]);
  });
});

describe('AUDIT_TYPES_BY_ASCENDING_REQUIREMENTS', () => {
  it("classe l'audit COT seul avant l'audit COT avec labellisation", () => {
    expect(AUDIT_TYPES_BY_ASCENDING_REQUIREMENTS).toEqual([
      SujetDemandeEnum.COT,
      SujetDemandeEnum.LABELLISATION_COT,
      SujetDemandeEnum.LABELLISATION,
    ]);
  });
});
