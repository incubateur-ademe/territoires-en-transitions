import { describe, expect, it } from 'vitest';
import { buildAnalysisRunPlan } from './build-analysis-run-plan.rules';
import { calculateFicheFingerprint } from './calculate-fiche-fingerprint.rules';

const ANALYZED_AT = new Date('2026-09-01T02:00:00Z');
const BEFORE_ANALYSIS = new Date('2026-08-15T10:00:00Z');
const AFTER_ANALYSIS = new Date('2026-09-10T10:00:00Z');

describe('full-flow', () => {
  it('classe une fiche sans statut', () => {
    const fiche = {
      ficheId: 1,
      collectiviteId: 10,
      titre: 'Pistes cyclables',
      description: 'Dix km',
      modifiedAt: BEFORE_ANALYSIS,
      isDeleted: false,
    };

    const plan = buildAnalysisRunPlan({ fiches: [fiche], analyses: [] });

    expect(plan).toEqual({
      toClassify: [fiche],
      toMarkStale: [],
      toRemove: [],
    });
  });
});

describe('full-flow-behavior-on-already-processed-action', () => {
  it("ne classe pas une fiche traitée dont l'empreinte est inchangée", () => {
    const plan = buildAnalysisRunPlan({
      fiches: [
        {
          ficheId: 1,
          collectiviteId: 10,
          titre: 'Pistes cyclables',
          description: 'Dix km',
          modifiedAt: AFTER_ANALYSIS,
          isDeleted: false,
        },
      ],
      analyses: [
        {
          ficheId: 1,
          collectiviteId: 10,
          analyzedAt: ANALYZED_AT,
          status: 'processed',
          fingerprint: calculateFicheFingerprint({
            titre: 'Pistes cyclables',
            description: 'Dix km',
          }),
        },
      ],
    });

    expect(plan).toEqual({ toClassify: [], toMarkStale: [], toRemove: [] });
  });

  it('ne classe, sur une CT déjà analysée, que les fiches nouvelles, périmées ou en erreur', () => {
    const plan = buildAnalysisRunPlan({
      fiches: [
        {
          ficheId: 1,
          collectiviteId: 10,
          titre: 'Traitée',
          description: null,
          modifiedAt: BEFORE_ANALYSIS,
          isDeleted: false,
        },
        {
          ficheId: 2,
          collectiviteId: 10,
          titre: 'Nouvelle',
          description: null,
          modifiedAt: AFTER_ANALYSIS,
          isDeleted: false,
        },
        {
          ficheId: 3,
          collectiviteId: 10,
          titre: 'Périmée',
          description: null,
          modifiedAt: BEFORE_ANALYSIS,
          isDeleted: false,
        },
        {
          ficheId: 4,
          collectiviteId: 10,
          titre: 'En erreur',
          description: null,
          modifiedAt: BEFORE_ANALYSIS,
          isDeleted: false,
        },
      ],
      analyses: [
        {
          ficheId: 1,
          collectiviteId: 10,
          analyzedAt: ANALYZED_AT,
          status: 'processed',
          fingerprint: calculateFicheFingerprint({
            titre: 'Traitée',
            description: null,
          }),
        },
        {
          ficheId: 3,
          collectiviteId: 10,
          analyzedAt: ANALYZED_AT,
          status: 'stale',
        },
        {
          ficheId: 4,
          collectiviteId: 10,
          analyzedAt: ANALYZED_AT,
          status: 'failed',
          retryCount: 1,
        },
      ],
    });

    expect(plan.toClassify.map(({ ficheId }) => ficheId)).toEqual([2, 3, 4]);
  });
});

describe('cron-action-management', () => {
  it('marque périmée et classe une fiche traitée dont le titre a changé', () => {
    const fiche = {
      ficheId: 1,
      collectiviteId: 10,
      titre: 'Pistes cyclables sécurisées',
      description: 'Dix km',
      modifiedAt: AFTER_ANALYSIS,
      isDeleted: false,
    };

    const plan = buildAnalysisRunPlan({
      fiches: [fiche],
      analyses: [
        {
          ficheId: 1,
          collectiviteId: 10,
          analyzedAt: ANALYZED_AT,
          status: 'processed',
          fingerprint: calculateFicheFingerprint({
            titre: 'Pistes cyclables',
            description: 'Dix km',
          }),
        },
      ],
    });

    expect(plan).toEqual({
      toClassify: [fiche],
      toMarkStale: [fiche],
      toRemove: [],
    });
  });

  it('ne marque pas périmée une fiche traitée modifiée hors titre et description', () => {
    const plan = buildAnalysisRunPlan({
      fiches: [
        {
          ficheId: 1,
          collectiviteId: 10,
          titre: 'Pistes cyclables',
          description: 'Dix km',
          modifiedAt: AFTER_ANALYSIS,
          isDeleted: false,
        },
      ],
      analyses: [
        {
          ficheId: 1,
          collectiviteId: 10,
          analyzedAt: ANALYZED_AT,
          status: 'processed',
          fingerprint: calculateFicheFingerprint({
            titre: 'Pistes cyclables',
            description: 'Dix km',
          }),
        },
      ],
    });

    expect(plan).toEqual({ toClassify: [], toMarkStale: [], toRemove: [] });
  });

  it('marque périmée et classe une fiche en erreur modifiée après sa dernière analyse', () => {
    const fiche = {
      ficheId: 1,
      collectiviteId: 10,
      titre: 'Pistes cyclables',
      description: 'Dix km',
      modifiedAt: AFTER_ANALYSIS,
      isDeleted: false,
    };

    const plan = buildAnalysisRunPlan({
      fiches: [fiche],
      analyses: [
        {
          ficheId: 1,
          collectiviteId: 10,
          analyzedAt: ANALYZED_AT,
          status: 'failed',
          retryCount: 2,
        },
      ],
    });

    expect(plan).toEqual({
      toClassify: [fiche],
      toMarkStale: [fiche],
      toRemove: [],
    });
  });
});

describe('daily-ct-check', () => {
  it('classe une fiche périmée sans la marquer périmée une seconde fois', () => {
    const fiche = {
      ficheId: 1,
      collectiviteId: 10,
      titre: 'Pistes cyclables',
      description: 'Dix km',
      modifiedAt: AFTER_ANALYSIS,
      isDeleted: false,
    };

    const plan = buildAnalysisRunPlan({
      fiches: [fiche],
      analyses: [
        {
          ficheId: 1,
          collectiviteId: 10,
          analyzedAt: ANALYZED_AT,
          status: 'stale',
          fingerprint: calculateFicheFingerprint({
            titre: 'Pistes cyclables',
            description: 'Cinq km',
          }),
        },
      ],
    });

    expect(plan).toEqual({
      toClassify: [fiche],
      toMarkStale: [],
      toRemove: [],
    });
  });
});

describe('retry-on-failure', () => {
  it('classe de nouveau une fiche en erreur non modifiée, sans la marquer périmée', () => {
    const fiche = {
      ficheId: 1,
      collectiviteId: 10,
      titre: 'Pistes cyclables',
      description: 'Dix km',
      modifiedAt: BEFORE_ANALYSIS,
      isDeleted: false,
    };

    const plan = buildAnalysisRunPlan({
      fiches: [fiche],
      analyses: [
        {
          ficheId: 1,
          collectiviteId: 10,
          analyzedAt: ANALYZED_AT,
          status: 'failed',
          retryCount: 5,
        },
      ],
    });

    expect(plan).toEqual({
      toClassify: [fiche],
      toMarkStale: [],
      toRemove: [],
    });
  });
});

describe('reclassification-on-deletion', () => {
  it('désigne pour nettoyage une fiche supprimée qui a un statut, sans la classer', () => {
    const fiche = {
      ficheId: 1,
      collectiviteId: 10,
      titre: 'Pistes cyclables',
      description: 'Dix km',
      modifiedAt: AFTER_ANALYSIS,
      isDeleted: true,
    };

    const plan = buildAnalysisRunPlan({
      fiches: [fiche],
      analyses: [
        {
          ficheId: 1,
          collectiviteId: 10,
          analyzedAt: ANALYZED_AT,
          status: 'processed',
          fingerprint: calculateFicheFingerprint({
            titre: 'Pistes cyclables',
            description: 'Dix km',
          }),
        },
      ],
    });

    expect(plan).toEqual({
      toClassify: [],
      toMarkStale: [],
      toRemove: [fiche],
    });
  });

  it('ignore une fiche supprimée sans statut', () => {
    const plan = buildAnalysisRunPlan({
      fiches: [
        {
          ficheId: 1,
          collectiviteId: 10,
          titre: 'Pistes cyclables',
          description: 'Dix km',
          modifiedAt: AFTER_ANALYSIS,
          isDeleted: true,
        },
      ],
      analyses: [],
    });

    expect(plan).toEqual({ toClassify: [], toMarkStale: [], toRemove: [] });
  });

  it('ne touche pas aux autres fiches traitées de la CT', () => {
    const removedFiche = {
      ficheId: 1,
      collectiviteId: 10,
      titre: 'Pistes cyclables',
      description: 'Dix km',
      modifiedAt: AFTER_ANALYSIS,
      isDeleted: true,
    };

    const plan = buildAnalysisRunPlan({
      fiches: [
        removedFiche,
        {
          ficheId: 2,
          collectiviteId: 10,
          titre: 'Bulletin municipal',
          description: null,
          modifiedAt: BEFORE_ANALYSIS,
          isDeleted: false,
        },
      ],
      analyses: [
        {
          ficheId: 1,
          collectiviteId: 10,
          analyzedAt: ANALYZED_AT,
          status: 'processed',
          fingerprint: calculateFicheFingerprint({
            titre: 'Pistes cyclables',
            description: 'Dix km',
          }),
        },
        {
          ficheId: 2,
          collectiviteId: 10,
          analyzedAt: ANALYZED_AT,
          status: 'processed',
          fingerprint: calculateFicheFingerprint({
            titre: 'Bulletin municipal',
            description: null,
          }),
        },
      ],
    });

    expect(plan).toEqual({
      toClassify: [],
      toMarkStale: [],
      toRemove: [removedFiche],
    });
  });
});

describe('invariants', () => {
  it('toute fiche marquée périmée est aussi à classer', () => {
    const renamedFiche = {
      ficheId: 1,
      collectiviteId: 10,
      titre: 'Nouveau titre',
      description: null,
      modifiedAt: AFTER_ANALYSIS,
      isDeleted: false,
    };
    const failedFiche = {
      ficheId: 2,
      collectiviteId: 10,
      titre: 'En erreur',
      description: null,
      modifiedAt: AFTER_ANALYSIS,
      isDeleted: false,
    };

    const plan = buildAnalysisRunPlan({
      fiches: [renamedFiche, failedFiche],
      analyses: [
        {
          ficheId: 1,
          collectiviteId: 10,
          analyzedAt: ANALYZED_AT,
          status: 'processed',
          fingerprint: calculateFicheFingerprint({
            titre: 'Ancien titre',
            description: null,
          }),
        },
        {
          ficheId: 2,
          collectiviteId: 10,
          analyzedAt: ANALYZED_AT,
          status: 'failed',
          retryCount: 1,
        },
      ],
    });

    expect(plan).toEqual({
      toClassify: [renamedFiche, failedFiche],
      toMarkStale: [renamedFiche, failedFiche],
      toRemove: [],
    });
  });

  it("ignore un statut dont la fiche n'est pas dans le passage", () => {
    const plan = buildAnalysisRunPlan({
      fiches: [],
      analyses: [
        {
          ficheId: 1,
          collectiviteId: 10,
          analyzedAt: ANALYZED_AT,
          status: 'failed',
          retryCount: 1,
        },
      ],
    });

    expect(plan).toEqual({ toClassify: [], toMarkStale: [], toRemove: [] });
  });

  it("garde l'ordre des fiches reçues dans les fiches à classer", () => {
    const plan = buildAnalysisRunPlan({
      fiches: [
        {
          ficheId: 3,
          collectiviteId: 10,
          titre: 'C',
          description: null,
          modifiedAt: BEFORE_ANALYSIS,
          isDeleted: false,
        },
        {
          ficheId: 1,
          collectiviteId: 10,
          titre: 'A',
          description: null,
          modifiedAt: BEFORE_ANALYSIS,
          isDeleted: false,
        },
      ],
      analyses: [],
    });

    expect(plan.toClassify.map(({ ficheId }) => ficheId)).toEqual([3, 1]);
  });
});
