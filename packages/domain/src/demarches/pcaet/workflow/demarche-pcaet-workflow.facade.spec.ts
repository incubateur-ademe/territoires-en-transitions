import { describe, expect, it } from 'vitest';
import {
  applyTransition,
  evaluateTransitions,
  getRequiredGuards,
} from './demarche-pcaet-workflow.facade';

describe('evaluateTransitions', () => {
  it('distingue une transition hors statut d’une transition bloquée', () => {
    const evaluation = evaluateTransitions('en_elaboration');
    expect(evaluation.transmettre_pour_avis.reachable).toBe(true);
    expect(evaluation.transmettre_pour_avis.blockedBy).toEqual([
      'estPilote',
      'dossierComplet',
    ]);
    // Publier ne se propose pas avant l'adoption : c'est la structure du cycle,
    // pas une condition non remplie.
    expect(evaluation.publier.reachable).toBe(false);
    expect(evaluation.publier.blockedBy).toEqual([]);
  });

  it('n’ouvre la publication qu’une fois le dossier adopté', () => {
    const evaluation = evaluateTransitions('adopte', { estPilote: true });
    expect(evaluation.publier.reachable).toBe(true);
    expect(evaluation.publier.blockedBy).toEqual(['documentsAvalComplets']);
    // L'archivage attend la publication.
    expect(evaluation.archiver.reachable).toBe(false);
  });
});

describe('getRequiredGuards', () => {
  it('ne demande que ce dont le statut courant dépend', () => {
    // La complétude du dossier ne pèse que sur une démarche en élaboration :
    // c'est ce qui évite de la lire pour les autres statuts.
    expect(getRequiredGuards('en_elaboration')).toEqual([
      'estPilote',
      'dossierComplet',
    ]);
    expect(getRequiredGuards('transmis_pour_avis')).toEqual([
      'estPilote',
      'delaiAvisEcoule',
    ]);
    expect(getRequiredGuards('adopte')).toEqual([
      'estPilote',
      'documentsAvalComplets',
    ]);
    expect(getRequiredGuards('archive')).toEqual([]);
  });
});

describe('applyTransition', () => {
  it('renvoie le statut cible quand les guards sont satisfaits', () => {
    expect(
      applyTransition('en_elaboration', 'transmettre_pour_avis', {
        guardResults: { estPilote: true, dossierComplet: true },
      })
    ).toEqual({ success: true, data: { toStatus: 'transmis_pour_avis' } });
    expect(
      applyTransition('adopte', 'publier', {
        guardResults: { estPilote: true, documentsAvalComplets: true },
      })
    ).toEqual({ success: true, data: { toStatus: 'publie' } });
    expect(
      applyTransition('publie', 'depublier', {
        guardResults: { estPilote: true },
      })
    ).toEqual({ success: true, data: { toStatus: 'adopte' } });
  });

  it('refuse une transition hors du statut courant', () => {
    expect(applyTransition('en_elaboration', 'archiver')).toEqual({
      success: false,
      error: 'TRANSITION_NOT_ALLOWED',
      blockedBy: [],
    });
    // Un dossier non adopté n'est pas publiable : la structure le dit.
    expect(applyTransition('en_elaboration', 'publier')).toEqual({
      success: false,
      error: 'TRANSITION_NOT_ALLOWED',
      blockedBy: [],
    });
    // Ni un dossier non publié archivable.
    expect(applyTransition('adopte', 'archiver')).toEqual({
      success: false,
      error: 'TRANSITION_NOT_ALLOWED',
      blockedBy: [],
    });
  });

  it('rapporte tous les guards non satisfaits, dans leur ordre de déclaration', () => {
    expect(applyTransition('en_elaboration', 'transmettre_pour_avis')).toEqual({
      success: false,
      error: 'GUARD_NOT_SATISFIED',
      blockedBy: ['estPilote', 'dossierComplet'],
    });
    expect(applyTransition('publie', 'archiver')).toEqual({
      success: false,
      error: 'GUARD_NOT_SATISFIED',
      blockedBy: ['estPilote', 'evaluationFinaleDeposee'],
    });
    // L'adoption reste une décision du pilote, même le délai d'avis écoulé.
    expect(
      applyTransition('transmis_pour_avis', 'adopter', {
        guardResults: { delaiAvisEcoule: true },
      })
    ).toEqual({
      success: false,
      error: 'GUARD_NOT_SATISFIED',
      blockedBy: ['estPilote'],
    });
  });

  it('refuse quand une partie seulement des guards est satisfaite', () => {
    expect(
      applyTransition('en_elaboration', 'transmettre_pour_avis', {
        guardResults: { estPilote: true },
      })
    ).toEqual({
      success: false,
      error: 'GUARD_NOT_SATISFIED',
      blockedBy: ['dossierComplet'],
    });
  });
});
