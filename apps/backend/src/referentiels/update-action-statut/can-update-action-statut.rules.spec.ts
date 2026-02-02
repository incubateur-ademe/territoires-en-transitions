import {
  CanUpdateActionStatutRulesErrorsEnum,
  canUpdateActionStatutWithoutPermissionCheck,
} from '@tet/domain/referentiels';

describe('canUpdateActionStatutWithoutPermissionCheck', () => {
  const defaultParams = {
    actions: [{ actionId: 'action-1', desactive: false }],
    isAuditeur: false,
  };

  it('returns ACTION_DISABLED when score is desactive', () => {
    const result = canUpdateActionStatutWithoutPermissionCheck({
      ...defaultParams,
      actions: [{ actionId: 'action-1', desactive: true }],
    });
    expect(result.canUpdate).toBe(false);
    expect(result.reason).toBe(
      CanUpdateActionStatutRulesErrorsEnum.ACTION_DISABLED
    );
  });

  it('returns AUDIT_STARTED_BUT_NOT_AUDITEUR when parcoursStatus is audit_en_cours and user is not auditeur', () => {
    const result = canUpdateActionStatutWithoutPermissionCheck({
      ...defaultParams,
      parcoursStatus: 'audit_en_cours',
      isAuditeur: false,
    });
    expect(result.canUpdate).toBe(false);
    expect(result.reason).toBe(
      CanUpdateActionStatutRulesErrorsEnum.AUDIT_STARTED_BUT_NOT_AUDITEUR
    );
  });

  it('returns canUpdate true when parcoursStatus is audit_en_cours and user is auditeur', () => {
    const result = canUpdateActionStatutWithoutPermissionCheck({
      ...defaultParams,
      parcoursStatus: 'audit_en_cours',
      isAuditeur: true,
    });
    expect(result.canUpdate).toBe(true);
    expect(result.reason).toBeNull();
  });

  it('returns AUDIT_VALIDATED when parcoursStatus is audit_valide', () => {
    const result = canUpdateActionStatutWithoutPermissionCheck({
      ...defaultParams,
      parcoursStatus: 'audit_valide',
    });
    expect(result.canUpdate).toBe(false);
    expect(result.reason).toBe(
      CanUpdateActionStatutRulesErrorsEnum.AUDIT_VALIDATED
    );
  });

  it('returns canUpdate true when no blocking conditions (default parcours status)', () => {
    const result = canUpdateActionStatutWithoutPermissionCheck(defaultParams);
    expect(result.canUpdate).toBe(true);
    expect(result.reason).toBeNull();
  });

  it('returns canUpdate true when parcoursStatus is non_demandee', () => {
    const result = canUpdateActionStatutWithoutPermissionCheck({
      ...defaultParams,
      parcoursStatus: 'non_demandee',
    });
    expect(result.canUpdate).toBe(true);
    expect(result.reason).toBeNull();
  });
});
