import {
  LabellisationAudit,
  ParcoursLabellisationStatus,
  ParcoursLabellisationStatusEnum,
  ParcoursLabellisationStatusValues,
} from '@tet/domain/referentiels';
import { describe, expect, it } from 'vitest';
import { CycleForAuditActif, isAuditActif } from './is-audit-actif';

const auditEnCours: LabellisationAudit = {
  id: 42,
  collectiviteId: 1,
  referentielId: 'cae',
  demandeId: null,
  dateDebut: null,
  dateFin: null,
  dateCnl: null,
  valide: false,
  valideLabellisation: false,
  clos: false,
};

function makeCycle({
  status = ParcoursLabellisationStatusEnum.AUDIT_EN_COURS,
  audit = auditEnCours,
}: {
  status?: ParcoursLabellisationStatus;
  audit?: LabellisationAudit | null;
} = {}): CycleForAuditActif {
  return { parcours: { status, audit } };
}

describe('isAuditActif', () => {
  it("est vrai quand le statut est audit_en_cours et l'audit existe", () => {
    expect(isAuditActif(makeCycle())).toBe(true);
  });

  it("est faux quand le statut n'est pas audit_en_cours", () => {
    const statutsNonAuditEnCours = ParcoursLabellisationStatusValues.filter(
      (status) => status !== ParcoursLabellisationStatusEnum.AUDIT_EN_COURS
    );

    statutsNonAuditEnCours.forEach((status) => {
      expect(isAuditActif(makeCycle({ status }))).toBe(false);
    });
  });

  it("est faux quand le parcours n'est pas chargé", () => {
    expect(isAuditActif({ parcours: null })).toBe(false);
  });

  it("est faux quand l'audit est null malgré le statut audit_en_cours", () => {
    expect(isAuditActif(makeCycle({ audit: null }))).toBe(false);
  });
});
