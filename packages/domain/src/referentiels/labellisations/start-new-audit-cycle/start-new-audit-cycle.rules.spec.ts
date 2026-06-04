import { SujetDemande } from '../labellisation-demande.schema';
import { ParcoursLabellisation } from '../parcours-labellisation.schema';
import { ParcoursLabellisationStatus } from '../parcours-labellisation-status.enum';
import { canStartNewAuditCycle } from './start-new-audit-cycle.rules';

type MinimalParcours = Pick<
  ParcoursLabellisation,
  'status' | 'demande' | 'labellisation'
>;

const buildParcours = ({
  status,
  envoyeeLe,
  obtenueLe,
  sujet,
  etoiles,
}: {
  status: ParcoursLabellisationStatus;
  envoyeeLe?: string;
  obtenueLe?: string;
  sujet?: SujetDemande;
  etoiles?: string;
}): MinimalParcours => ({
  status,
  demande:
    envoyeeLe || sujet
      ? ({
          en_cours: true,
          envoyee_le: envoyeeLe ?? null,
          sujet: sujet ?? null,
          etoiles: etoiles ?? null,
        } as MinimalParcours['demande'])
      : null,
  labellisation: obtenueLe
    ? ({
        obtenue_le: obtenueLe,
      } as MinimalParcours['labellisation'])
    : null,
});

describe('canStartNewAuditCycle', () => {
  it('autorise quand parcours est null', () => {
    expect(canStartNewAuditCycle(null)).toEqual({
      canRequest: true,
      reason: null,
    });
  });

  it('autorise quand status est non_demandee', () => {
    expect(
      canStartNewAuditCycle(buildParcours({ status: 'non_demandee' }))
    ).toEqual({ canRequest: true, reason: null });
  });

  it('refuse avec AUDIT_REQUEST_PENDING quand status est demande_envoyee', () => {
    expect(
      canStartNewAuditCycle(
        buildParcours({
          status: 'demande_envoyee',
          envoyeeLe: '2026-01-01T00:00:00.000Z',
        })
      )
    ).toEqual({ canRequest: false, reason: 'AUDIT_REQUEST_PENDING' });
  });

  it('autorise un nouveau cycle quand une demande de 1ère étoile est envoyée (vérification ADEME, sans audit)', () => {
    expect(
      canStartNewAuditCycle(
        buildParcours({
          status: 'demande_envoyee',
          envoyeeLe: '2026-01-01T00:00:00.000Z',
          sujet: 'labellisation',
          etoiles: '1',
        })
      )
    ).toEqual({ canRequest: true, reason: null });
  });

  it('refuse avec AUDIT_IN_PROGRESS quand status est audit_en_cours', () => {
    expect(
      canStartNewAuditCycle(
        buildParcours({
          status: 'audit_en_cours',
          envoyeeLe: '2026-01-01T00:00:00.000Z',
        })
      )
    ).toEqual({ canRequest: false, reason: 'AUDIT_IN_PROGRESS' });
  });

  it('refuse avec LABELLISATION_IN_PROGRESS quand status est audit_valide sans labellisation obtenue', () => {
    expect(
      canStartNewAuditCycle(
        buildParcours({
          status: 'audit_valide',
          envoyeeLe: '2026-01-01T00:00:00.000Z',
        })
      )
    ).toEqual({ canRequest: false, reason: 'LABELLISATION_IN_PROGRESS' });
  });

  it('autorise quand la labellisation est obtenue (cycle terminé)', () => {
    expect(
      canStartNewAuditCycle(
        buildParcours({
          status: 'audit_valide',
          envoyeeLe: '2026-01-01T00:00:00.000Z',
          obtenueLe: '2026-06-01T00:00:00.000Z',
        })
      )
    ).toEqual({ canRequest: true, reason: null });
  });

  it('autorise pour un audit_valide avec sujet COT (défensif : cycle sans labellisation)', () => {
    expect(
      canStartNewAuditCycle(
        buildParcours({
          status: 'audit_valide',
          envoyeeLe: '2026-01-01T00:00:00.000Z',
          sujet: 'cot',
        })
      )
    ).toEqual({ canRequest: true, reason: null });
  });

  it('refuse avec LABELLISATION_IN_PROGRESS quand la labellisation obtenue est antérieure à la demande (étoile précédente déjà obtenue)', () => {
    expect(
      canStartNewAuditCycle(
        buildParcours({
          status: 'audit_valide',
          sujet: 'labellisation',
          envoyeeLe: '2026-06-01T00:00:00.000Z',
          obtenueLe: '2026-01-01T00:00:00.000Z',
        })
      )
    ).toEqual({ canRequest: false, reason: 'LABELLISATION_IN_PROGRESS' });
  });

  it('refuse avec LABELLISATION_IN_PROGRESS quand la labellisation est présente mais la demande n\'a pas d\'envoyee_le (anomalie : on reste bloqué)', () => {
    expect(
      canStartNewAuditCycle(
        buildParcours({
          status: 'audit_valide',
          sujet: 'labellisation',
          obtenueLe: '2026-06-01T00:00:00.000Z',
        })
      )
    ).toEqual({ canRequest: false, reason: 'LABELLISATION_IN_PROGRESS' });
  });
});
