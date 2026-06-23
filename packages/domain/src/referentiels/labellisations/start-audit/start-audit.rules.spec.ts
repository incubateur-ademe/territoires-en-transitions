import { ParcoursLabellisation } from '../parcours-labellisation.schema';
import { ParcoursLabellisationStatus } from '../parcours-labellisation-status.enum';
import { canStartAudit } from './start-audit.rules';
import { StartAuditRulesErrorsEnum } from './start-audit.rules-errors';

type MinimalParcours = Pick<ParcoursLabellisation, 'status' | 'auditeurs'>;

const auditeurId = 'auditeur-1';

const buildParcours = ({
  status = 'demande_envoyee',
  auditeurIds = [auditeurId],
}: {
  status?: ParcoursLabellisationStatus;
  auditeurIds?: string[];
} = {}): MinimalParcours => ({
  status,
  auditeurs: auditeurIds.map((userId) => ({ userId, nom: userId })),
});

describe('canStartAudit', () => {
  it('returns AUDIT_NOT_FOUND when parcours is null', () => {
    const result = canStartAudit(null, auditeurId);
    expect(result).toEqual({
      canRequest: false,
      reason: StartAuditRulesErrorsEnum.AUDIT_NOT_FOUND,
    });
  });

  it('returns AUDIT_NOT_REQUESTED when status is not demande_envoyee', () => {
    const result = canStartAudit(
      buildParcours({ status: 'non_demandee' }),
      auditeurId
    );
    expect(result).toEqual({
      canRequest: false,
      reason: StartAuditRulesErrorsEnum.AUDIT_NOT_REQUESTED,
    });
  });

  it("returns AUDIT_NOT_REQUESTED when an audit is already en cours", () => {
    const result = canStartAudit(
      buildParcours({ status: 'audit_en_cours' }),
      auditeurId
    );
    expect(result).toEqual({
      canRequest: false,
      reason: StartAuditRulesErrorsEnum.AUDIT_NOT_REQUESTED,
    });
  });

  it("returns USER_NOT_AUDITOR when the user is not among the parcours auditeurs", () => {
    const result = canStartAudit(
      buildParcours({ auditeurIds: ['un-autre-auditeur'] }),
      auditeurId
    );
    expect(result).toEqual({
      canRequest: false,
      reason: StartAuditRulesErrorsEnum.USER_NOT_AUDITOR,
    });
  });

  it("returns USER_NOT_AUDITOR when no auditeur is assigned", () => {
    const result = canStartAudit(
      buildParcours({ auditeurIds: [] }),
      auditeurId
    );
    expect(result).toEqual({
      canRequest: false,
      reason: StartAuditRulesErrorsEnum.USER_NOT_AUDITOR,
    });
  });

  it('autorise le démarrage quand la demande est envoyée et que le user est auditeur assigné', () => {
    const result = canStartAudit(buildParcours(), auditeurId);
    expect(result).toEqual({ canRequest: true, reason: null });
  });
});
