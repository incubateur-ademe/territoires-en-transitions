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
    // Publier ne se propose pas avant la clôture de l'instruction : c'est la
    // structure du cycle, pas une condition non remplie.
    expect(evaluation.publier.reachable).toBe(false);
    expect(evaluation.publier.blockedBy).toEqual([]);
  });

  it('n’ouvre la publication qu’une fois l’instruction close', () => {
    const evaluation = evaluateTransitions('instruit', { estPilote: true });
    expect(evaluation.publier.reachable).toBe(true);
    expect(evaluation.publier.blockedBy).toEqual(['documentsAvalComplets']);
    // L'archivage attend la publication.
    expect(evaluation.archiver.reachable).toBe(false);
  });

  it('ouvre les deux chemins vers l’instruction, indépendamment', () => {
    const evaluation = evaluateTransitions('transmis_pour_avis', {
      avisTousRendus: false,
      delaiAvisEcoule: true,
    });
    expect(evaluation.avis_tous_rendus.reachable).toBe(true);
    expect(evaluation.avis_tous_rendus.enabled).toBe(false);
    expect(evaluation.delai_avis_echu.enabled).toBe(true);
  });
});

describe('getRequiredGuards', () => {
  it('ne demande que ce dont le statut courant dépend', () => {
    // La complétude du dossier ne pèse que sur une démarche en élaboration :
    // c'est ce qui évite de la lire pour les autres statuts. L'achèvement des
    // avis n'y compte pas — un dossier en élaboration n'a jamais été transmis,
    // donc aucune instance n'y a été saisie.
    expect(getRequiredGuards('en_elaboration')).toEqual([
      'estPilote',
      'dossierComplet',
    ]);
    // Plus aucun acteur ici : les deux seules sorties d'un dossier transmis
    // sont constatées par le système, donc `estPilote` n'a rien à garder.
    expect(getRequiredGuards('transmis_pour_avis')).toEqual([
      'avisTousRendus',
      'delaiAvisEcoule',
    ]);
    expect(getRequiredGuards('instruit')).toEqual([
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
      applyTransition('instruit', 'publier', {
        guardResults: { estPilote: true, documentsAvalComplets: true },
      })
    ).toEqual({ success: true, data: { toStatus: 'publie' } });
    expect(
      applyTransition('publie', 'depublier', {
        guardResults: { estPilote: true },
      })
    ).toEqual({ success: true, data: { toStatus: 'instruit' } });
    // Sans acteur : c'est ce qui rend ces deux-là applicables par le système.
    expect(
      applyTransition('transmis_pour_avis', 'avis_tous_rendus', {
        guardResults: { avisTousRendus: true },
      })
    ).toEqual({ success: true, data: { toStatus: 'instruit' } });
    expect(
      applyTransition('transmis_pour_avis', 'delai_avis_echu', {
        guardResults: { delaiAvisEcoule: true },
      })
    ).toEqual({ success: true, data: { toStatus: 'instruit' } });
  });

  it('refuse une transition hors du statut courant', () => {
    expect(applyTransition('en_elaboration', 'archiver')).toEqual({
      success: false,
      error: 'TRANSITION_NOT_ALLOWED',
      blockedBy: [],
    });
    // Un dossier dont l'instruction n'est pas close n'est pas publiable : la
    // structure le dit.
    expect(applyTransition('en_elaboration', 'publier')).toEqual({
      success: false,
      error: 'TRANSITION_NOT_ALLOWED',
      blockedBy: [],
    });
    // Ni un dossier non publié archivable.
    expect(applyTransition('instruit', 'archiver')).toEqual({
      success: false,
      error: 'TRANSITION_NOT_ALLOWED',
      blockedBy: [],
    });
    // La transmission est sans retour : le dossier est entre les mains des
    // instances consultatives, et rien ne le ramène à l'élaboration.
    expect(applyTransition('transmis_pour_avis', 'depublier')).toEqual({
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
    // Le délai non échu bloque son propre chemin, sans rien dire de l'autre.
    expect(
      applyTransition('transmis_pour_avis', 'delai_avis_echu', {
        guardResults: { delaiAvisEcoule: false },
      })
    ).toEqual({
      success: false,
      error: 'GUARD_NOT_SATISFIED',
      blockedBy: ['delaiAvisEcoule'],
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
