import { describe, expect, it } from 'vitest';
import { DemarchePcaetStatusEnum } from './demarche-pcaet-status.enum.schema';
import {
  applyTransition,
  canDeleteDemarchePcaet,
  canPublishDemarchePcaetStatus,
  canTransition,
  computeAvisDeadline,
  DEMARCHE_PCAET_INITIAL_STATUS,
  DEMARCHE_PCAET_TRANSITIONS,
  getEnabledTransitions,
  isActiveDemarchePcaetStatus,
  isDemarchePcaetPilote,
  isEditableDemarchePcaetStatus,
} from './demarche-pcaet.workflow';

describe('DEMARCHE_PCAET_TRANSITIONS', () => {
  it('every transition declares valid statuses', () => {
    for (const def of Object.values(DEMARCHE_PCAET_TRANSITIONS)) {
      expect(def.from.length).toBeGreaterThan(0);
      expect(def.from).not.toContain(def.to);
    }
  });

  it('initial status is en_elaboration', () => {
    expect(DEMARCHE_PCAET_INITIAL_STATUS).toBe(
      DemarchePcaetStatusEnum.EN_ELABORATION
    );
  });
});

describe('canTransition / getEnabledTransitions', () => {
  it('follows the lifecycle: élaboration → transmis → adopté → archivé', () => {
    expect(getEnabledTransitions('en_elaboration')).toEqual([
      'transmettre_pour_avis',
    ]);
    expect(getEnabledTransitions('transmis_pour_avis').sort()).toEqual(
      ['adopter', 'reprendre_elaboration'].sort()
    );
    expect(getEnabledTransitions('adopte')).toEqual(['archiver']);
    expect(getEnabledTransitions('archive')).toEqual([]);
  });

  it('refuses a transition from an undeclared source status', () => {
    expect(canTransition('en_elaboration', 'adopter')).toBe(false);
    expect(canTransition('adopte', 'transmettre_pour_avis')).toBe(false);
    expect(canTransition('archive', 'archiver')).toBe(false);
  });
});

describe('applyTransition', () => {
  it('applies a transition when its guards are satisfied', () => {
    expect(
      applyTransition('en_elaboration', 'transmettre_pour_avis', {
        guardResults: { estPilote: true },
      })
    ).toEqual({ success: true, data: { toStatus: 'transmis_pour_avis' } });
    expect(
      applyTransition('transmis_pour_avis', 'reprendre_elaboration', {
        guardResults: { estPilote: true },
      })
    ).toEqual({ success: true, data: { toStatus: 'en_elaboration' } });
  });

  it('fails with TRANSITION_NOT_ALLOWED from a wrong source status', () => {
    expect(applyTransition('en_elaboration', 'archiver')).toEqual({
      success: false,
      error: 'TRANSITION_NOT_ALLOWED',
    });
  });

  it('fails closed when a guarded transition has no guard result', () => {
    expect(applyTransition('transmis_pour_avis', 'adopter')).toEqual({
      success: false,
      error: 'GUARD_NOT_SATISFIED',
    });
    expect(applyTransition('adopte', 'archiver')).toEqual({
      success: false,
      error: 'GUARD_NOT_SATISFIED',
    });
  });

  it('succeeds when the declared guard is satisfied', () => {
    expect(
      applyTransition('transmis_pour_avis', 'adopter', {
        guardResults: { delaiAvisEcoule: true },
      })
    ).toEqual({ success: true, data: { toStatus: 'adopte' } });
    expect(
      applyTransition('adopte', 'archiver', {
        guardResults: { estPilote: true, evaluationFinaleDeposee: true },
      })
    ).toEqual({ success: true, data: { toStatus: 'archive' } });
  });
});

describe('règles dérivées du statut', () => {
  it('en cours : élaboration et transmission bloquent un nouveau dépôt', () => {
    expect(isActiveDemarchePcaetStatus('en_elaboration')).toBe(true);
    expect(isActiveDemarchePcaetStatus('transmis_pour_avis')).toBe(true);
    expect(isActiveDemarchePcaetStatus('adopte')).toBe(false);
    expect(isActiveDemarchePcaetStatus('archive')).toBe(false);
  });

  it('suppression : uniquement en élaboration et jamais transmise', () => {
    expect(
      canDeleteDemarchePcaet({ status: 'en_elaboration', transmittedAt: null })
    ).toBe(true);
    // Transmise puis reprise en élaboration : le dossier est engagé dans le
    // circuit d'avis, plus de suppression.
    expect(
      canDeleteDemarchePcaet({
        status: 'en_elaboration',
        transmittedAt: '2026-05-01T00:00:00.000Z',
      })
    ).toBe(false);
    expect(
      canDeleteDemarchePcaet({
        status: 'transmis_pour_avis',
        transmittedAt: '2026-05-01T00:00:00.000Z',
      })
    ).toBe(false);
    expect(
      canDeleteDemarchePcaet({ status: 'adopte', transmittedAt: null })
    ).toBe(false);
  });

  it('computeAvisDeadline : délai légal appliqué à la date de transmission', () => {
    expect(
      computeAvisDeadline(new Date('2026-08-06T10:00:00.000Z')).toISOString()
    ).toBe('2026-11-06T10:00:00.000Z');
    // Fin de mois : le débordement est reporté (31 août + 3 mois → 1er déc.).
    expect(
      computeAvisDeadline(new Date('2026-08-31T10:00:00.000Z')).toISOString()
    ).toBe('2026-12-01T10:00:00.000Z');
  });

  it('publication : uniquement une fois adopté (ou archivé)', () => {
    expect(canPublishDemarchePcaetStatus('en_elaboration')).toBe(false);
    expect(canPublishDemarchePcaetStatus('transmis_pour_avis')).toBe(false);
    expect(canPublishDemarchePcaetStatus('adopte')).toBe(true);
    expect(canPublishDemarchePcaetStatus('archive')).toBe(true);
  });

  it('édition du header : uniquement pendant l’élaboration', () => {
    expect(isEditableDemarchePcaetStatus('en_elaboration')).toBe(true);
    expect(isEditableDemarchePcaetStatus('transmis_pour_avis')).toBe(false);
  });
});

describe('guard estPilote', () => {
  it('transmettre, reprendre et archiver sont gardées par estPilote', () => {
    expect(DEMARCHE_PCAET_TRANSITIONS.transmettre_pour_avis.guards).toContain(
      'estPilote'
    );
    expect(DEMARCHE_PCAET_TRANSITIONS.reprendre_elaboration.guards).toContain(
      'estPilote'
    );
    expect(DEMARCHE_PCAET_TRANSITIONS.archiver.guards).toContain('estPilote');
    expect(DEMARCHE_PCAET_TRANSITIONS.adopter.guards).not.toContain(
      'estPilote'
    );
  });

  it('isDemarchePcaetPilote : pilote à compte, ou fallback sans pilote utilisateur', () => {
    expect(isDemarchePcaetPilote('u1', [{ userId: 'u1' }])).toBe(true);
    expect(isDemarchePcaetPilote('u2', [{ userId: 'u1' }])).toBe(false);
    // Pilotes uniquement en tags (sans compte) → tout éditeur est autorisé.
    expect(isDemarchePcaetPilote('u2', [{ userId: null }])).toBe(true);
    expect(isDemarchePcaetPilote('u2', [])).toBe(true);
  });
});
