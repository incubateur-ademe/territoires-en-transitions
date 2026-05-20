import {
  ParcoursLabellisation,
  ParcoursLabellisationStatus,
  SujetDemande,
} from '@tet/domain/referentiels';
import { parcoursToAuditBadgeStatus } from './parcours-to-audit-badge-status';
import { AuditViewerRole } from './types';

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
}: {
  status: ParcoursLabellisationStatus;
  auditeursCount?: number;
  envoyeeLe?: string;
  obtenueLe?: string;
  sujet?: SujetDemande;
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
        parcoursToAuditBadgeStatus({ parcours: null, viewerRole: 'auditee' })
      ).toBeNull();
    });

    it('retourne null quand viewerRole est `other`', () => {
      expect(
        parcoursToAuditBadgeStatus({
          parcours: buildParcours({ status: 'demande_envoyee' }),
          viewerRole: 'other',
        })
      ).toBeNull();
    });

    it('retourne null quand le cycle est non_demandee', () => {
      expect(
        parcoursToAuditBadgeStatus({
          parcours: buildParcours({ status: 'non_demandee' }),
          viewerRole: 'auditee',
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

    it('auditee voit `auditRequested`', () => {
      expect(
        parcoursToAuditBadgeStatus({ parcours, viewerRole: 'auditee' })
      ).toBe('auditRequested');
    });

    it("auditor ne voit rien (pas encore d'attribution)", () => {
      expect(
        parcoursToAuditBadgeStatus({ parcours, viewerRole: 'auditor' })
      ).toBeNull();
    });
  });

  describe('phase demande_envoyee (avec auditors assignés)', () => {
    const parcours = buildParcours({
      status: 'demande_envoyee',
      auditeursCount: 1,
      envoyeeLe: '2026-01-01T00:00:00.000Z',
    });

    it('auditee continue de voir `auditRequested` (pas de bascule visible)', () => {
      expect(
        parcoursToAuditBadgeStatus({ parcours, viewerRole: 'auditee' })
      ).toBe('auditRequested');
    });

    it('auditor voit `auditAssigned`', () => {
      expect(
        parcoursToAuditBadgeStatus({ parcours, viewerRole: 'auditor' })
      ).toBe('auditAssigned');
    });
  });

  describe('phase audit_en_cours', () => {
    const parcours = buildParcours({
      status: 'audit_en_cours',
      auditeursCount: 1,
      envoyeeLe: '2026-01-01T00:00:00.000Z',
    });

    it.each(['auditee', 'auditor'] as const)(
      'viewer %s voit `auditInProgress`',
      (viewerRole: AuditViewerRole) => {
        expect(
          parcoursToAuditBadgeStatus({ parcours, viewerRole })
        ).toBe('auditInProgress');
      }
    );
  });

  describe('phase audit_valide', () => {
    it('auditor voit `auditCompleted`', () => {
      expect(
        parcoursToAuditBadgeStatus({
          parcours: buildParcours({
            status: 'audit_valide',
            envoyeeLe: '2026-01-01T00:00:00.000Z',
            sujet: 'labellisation',
          }),
          viewerRole: 'auditor',
        })
      ).toBe('auditCompleted');
    });

    it('auditee voit `auditCompletedLabellisationInProgress` quand la labellisation n\'a pas encore été obtenue', () => {
      expect(
        parcoursToAuditBadgeStatus({
          parcours: buildParcours({
            status: 'audit_valide',
            envoyeeLe: '2026-01-01T00:00:00.000Z',
            sujet: 'labellisation',
          }),
          viewerRole: 'auditee',
        })
      ).toBe('auditCompletedLabellisationInProgress');
    });

    it('auditee voit `auditCompletedLabellisationInProgress` même quand sujet=labellisation_cot', () => {
      expect(
        parcoursToAuditBadgeStatus({
          parcours: buildParcours({
            status: 'audit_valide',
            envoyeeLe: '2026-01-01T00:00:00.000Z',
            sujet: 'labellisation_cot',
          }),
          viewerRole: 'auditee',
        })
      ).toBe('auditCompletedLabellisationInProgress');
    });

    it("auditee ne voit pas de badge quand la labellisation a été obtenue (cycle terminé)", () => {
      expect(
        parcoursToAuditBadgeStatus({
          parcours: buildParcours({
            status: 'audit_valide',
            envoyeeLe: '2026-01-01T00:00:00.000Z',
            obtenueLe: '2026-06-01T00:00:00.000Z',
            sujet: 'labellisation',
          }),
          viewerRole: 'auditee',
        })
      ).toBeNull();
    });

    it('auditee ne voit pas de badge pour un audit_valide avec sujet=cot (défensif)', () => {
      expect(
        parcoursToAuditBadgeStatus({
          parcours: buildParcours({
            status: 'audit_valide',
            envoyeeLe: '2026-01-01T00:00:00.000Z',
            sujet: 'cot',
          }),
          viewerRole: 'auditee',
        })
      ).toBeNull();
    });
  });
});
