import { describe, expect, it } from 'vitest';
import { getAuditColumnsScope } from './audit-columns-scope';

describe('getAuditColumnsScope', () => {
  it("masque les colonnes d'audit quand aucun audit n'est demandé", () => {
    expect(
      getAuditColumnsScope({
        parcoursStatus: 'non_demandee',
        isConductingAudit: false,
      })
    ).toBe('none');
  });

  it("masque les colonnes d'audit tant que l'audit n'a pas démarré", () => {
    expect(
      getAuditColumnsScope({
        parcoursStatus: 'demande_envoyee',
        isConductingAudit: false,
      })
    ).toBe('none');
  });

  it("masque les colonnes d'audit une fois l'audit validé", () => {
    expect(
      getAuditColumnsScope({
        parcoursStatus: 'audit_valide',
        isConductingAudit: false,
      })
    ).toBe('none');
  });

  it("expose toutes les colonnes d'audit à l'auditeur qui conduit l'audit", () => {
    expect(
      getAuditColumnsScope({
        parcoursStatus: 'audit_en_cours',
        isConductingAudit: true,
      })
    ).toBe('all');
  });

  it("expose la seule colonne de statut au membre qui ne conduit pas l'audit en cours", () => {
    expect(
      getAuditColumnsScope({
        parcoursStatus: 'audit_en_cours',
        isConductingAudit: false,
      })
    ).toBe('statut');
  });
});
