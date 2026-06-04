import {
  ParcoursLabellisation,
  ParcoursLabellisationStatus,
  SujetDemande,
} from '@tet/domain/referentiels';
import { parcoursToAuditBadgeStatus } from './parcours-to-audit-badge-status';

type ParcoursForBadge = Pick<
  ParcoursLabellisation,
  'status' | 'auditeurs' | 'demande' | 'labellisation'
>;

const buildParcours = ({
  status,
  auditeursCount = 0,
  envoyeeLe,
  obtenueLe,
  sujet,
  etoiles,
}: {
  status: ParcoursLabellisationStatus;
  auditeursCount?: number;
  envoyeeLe?: string;
  obtenueLe?: string;
  sujet?: SujetDemande;
  etoiles?: string;
}): ParcoursLabellisation => {
  const minimal: ParcoursForBadge = {
    status,
    auditeurs: Array.from({ length: auditeursCount }, (_, i) => ({
      userId: `auditor-${i}`,
      nom: `Auditor ${i}`,
    })),
    demande:
      envoyeeLe || sujet
        ? ({
            en_cours: true,
            envoyee_le: envoyeeLe ?? null,
            sujet: sujet ?? null,
            etoiles: etoiles ?? null,
          } as ParcoursForBadge['demande'])
        : null,
    labellisation: obtenueLe
      ? ({
          obtenue_le: obtenueLe,
        } as ParcoursForBadge['labellisation'])
      : null,
  };
  return minimal as ParcoursLabellisation;
};

describe('parcoursToAuditBadgeStatus', () => {
  describe('cas généraux', () => {
    it('retourne null quand parcours est null', () => {
      expect(
        parcoursToAuditBadgeStatus({ parcours: null, isAuditor: false })
      ).toBeNull();
    });

    it('retourne null quand le cycle est non_demandee', () => {
      expect(
        parcoursToAuditBadgeStatus({
          parcours: buildParcours({ status: 'non_demandee' }),
          isAuditor: false,
        })
      ).toBeNull();
    });
  });

  describe('phase demande_envoyee (sans auditor assigné)', () => {
    const parcours = buildParcours({
      status: 'demande_envoyee',
      auditeursCount: 0,
      envoyeeLe: '2026-01-01T00:00:00.000Z',
    });

    it('non-auditeur voit `auditRequested`', () => {
      expect(
        parcoursToAuditBadgeStatus({ parcours, isAuditor: false })
      ).toBe('auditRequested');
    });

    it("auditor ne voit rien (pas encore d'attribution)", () => {
      expect(
        parcoursToAuditBadgeStatus({ parcours, isAuditor: true })
      ).toBeNull();
    });
  });

  describe('phase demande_envoyee (avec auditors assignés)', () => {
    const parcours = buildParcours({
      status: 'demande_envoyee',
      auditeursCount: 1,
      envoyeeLe: '2026-01-01T00:00:00.000Z',
    });

    it('non-auditeur continue de voir `auditRequested` (pas de bascule visible)', () => {
      expect(
        parcoursToAuditBadgeStatus({ parcours, isAuditor: false })
      ).toBe('auditRequested');
    });

    it('auditor voit `auditAssigned`', () => {
      expect(
        parcoursToAuditBadgeStatus({ parcours, isAuditor: true })
      ).toBe('auditAssigned');
    });
  });

  describe('demande de 1ère étoile (vérification ADEME, sans audit)', () => {
    const parcours = buildParcours({
      status: 'demande_envoyee',
      auditeursCount: 0,
      envoyeeLe: '2026-01-01T00:00:00.000Z',
      sujet: 'labellisation',
      etoiles: '1',
    });

    it("non-auditeur ne voit pas de badge « Audit demandé »", () => {
      expect(
        parcoursToAuditBadgeStatus({ parcours, isAuditor: false })
      ).toBeNull();
    });
  });

  describe('phase audit_en_cours', () => {
    const parcours = buildParcours({
      status: 'audit_en_cours',
      auditeursCount: 1,
      envoyeeLe: '2026-01-01T00:00:00.000Z',
    });

    it.each([true, false])(
      'viewer (isAuditor=%s) voit `auditInProgress`',
      (isAuditor: boolean) => {
        expect(
          parcoursToAuditBadgeStatus({ parcours, isAuditor })
        ).toBe('auditInProgress');
      }
    );
  });

  describe('phase audit_valide', () => {
    it('auditor voit `auditCompleted` pour une demande de labellisation', () => {
      expect(
        parcoursToAuditBadgeStatus({
          parcours: buildParcours({
            status: 'audit_valide',
            envoyeeLe: '2026-01-01T00:00:00.000Z',
            sujet: 'labellisation',
          }),
          isAuditor: true,
        })
      ).toBe('auditCompleted');
    });

    it('auditor voit `auditCompleted` même après labellisation obtenue', () => {
      expect(
        parcoursToAuditBadgeStatus({
          parcours: buildParcours({
            status: 'audit_valide',
            envoyeeLe: '2026-01-01T00:00:00.000Z',
            obtenueLe: '2026-06-01T00:00:00.000Z',
            sujet: 'labellisation',
          }),
          isAuditor: true,
        })
      ).toBe('auditCompleted');
    });

    it("non-auditeur voit `auditCompletedLabellisationInProgress` quand la labellisation n'a pas encore été obtenue", () => {
      expect(
        parcoursToAuditBadgeStatus({
          parcours: buildParcours({
            status: 'audit_valide',
            envoyeeLe: '2026-01-01T00:00:00.000Z',
            sujet: 'labellisation',
          }),
          isAuditor: false,
        })
      ).toBe('auditCompletedLabellisationInProgress');
    });

    it('non-auditeur voit `auditCompletedLabellisationInProgress` même quand sujet=labellisation_cot', () => {
      expect(
        parcoursToAuditBadgeStatus({
          parcours: buildParcours({
            status: 'audit_valide',
            envoyeeLe: '2026-01-01T00:00:00.000Z',
            sujet: 'labellisation_cot',
          }),
          isAuditor: false,
        })
      ).toBe('auditCompletedLabellisationInProgress');
    });

    it('non-auditeur ne voit pas de badge quand la labellisation a été obtenue (cycle terminé)', () => {
      expect(
        parcoursToAuditBadgeStatus({
          parcours: buildParcours({
            status: 'audit_valide',
            envoyeeLe: '2026-01-01T00:00:00.000Z',
            obtenueLe: '2026-06-01T00:00:00.000Z',
            sujet: 'labellisation',
          }),
          isAuditor: false,
        })
      ).toBeNull();
    });

    it('non-auditeur ne voit pas de badge pour un audit_valide avec sujet=cot (défensif)', () => {
      expect(
        parcoursToAuditBadgeStatus({
          parcours: buildParcours({
            status: 'audit_valide',
            envoyeeLe: '2026-01-01T00:00:00.000Z',
            sujet: 'cot',
          }),
          isAuditor: false,
        })
      ).toBeNull();
    });
  });
});
