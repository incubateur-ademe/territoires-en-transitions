import { type CorrelatedActionWithScore } from '@tet/backend/referentiels/correlated-actions/referentiel-action-origine-with-score.dto';
import {
  ActionTypeEnum,
  ReferentielIdEnum,
  StatutAvancementEnum,
  type ActionScore,
} from '@tet/domain/referentiels';
import { type ActionCible } from '../shared/action-cible';
import { type SwitchToTeContext } from '../shared/switch-to-te-context';
import {
  arrondiTripletCinqPourcent,
  deriveStatutDetailleAuPourcentage,
  deriveStatutDiscret,
  deriveStatutFromProjection,
  deriveTripletFromProjectedPoints,
  isTripletStatutDiscret,
  MERGE_STATUTS_STATUT_DISCRET_EPSILON,
  mergeStatuts,
} from './merge-statuts.rules';

describe('merge-statuts.rules', () => {
  describe('deriveTripletFromProjectedPoints', () => {
    it('calcule les fractions à partir des points projetés', () => {
      expect(
        deriveTripletFromProjectedPoints({
          pointFait: 7,
          pointProgramme: 0,
          pointPasFait: 3,
          pointPotentiel: 10,
        })
      ).toEqual([0.7, 0, 0.3]);
    });

    it('retourne [0,0,0] si pointPotentiel est nul', () => {
      expect(
        deriveTripletFromProjectedPoints({
          pointFait: 1,
          pointProgramme: 0,
          pointPasFait: 0,
          pointPotentiel: 0,
        })
      ).toEqual([0, 0, 0]);
    });
  });

  describe('isTripletStatutDiscret', () => {
    it('détecte un triplet pur [1,0,0]', () => {
      expect(isTripletStatutDiscret([1, 0, 0])).toBe(true);
    });

    it('absorbe le résidu post-arrondi scoring [0.999, 0, 0.001]', () => {
      expect(isTripletStatutDiscret([0.999, 0, 0.001])).toBe(true);
    });

    it('rejette un triplet détaillé [0.74, 0, 0.26]', () => {
      expect(isTripletStatutDiscret([0.74, 0, 0.26])).toBe(false);
    });

    it('rejette le bord détaillé [0.99, 0, 0.01] (0.01 > ε)', () => {
      expect(isTripletStatutDiscret([0.99, 0, 0.01])).toBe(false);
      expect(0.01).toBeGreaterThan(MERGE_STATUTS_STATUT_DISCRET_EPSILON);
    });
  });

  describe('deriveStatutDiscret', () => {
    it('retourne fait pour un triplet dominant fait', () => {
      expect(deriveStatutDiscret([1, 0, 0])).toEqual({
        statut: StatutAvancementEnum.FAIT,
      });
    });

    it('retourne fait pour un résidu post-arrondi scoring', () => {
      expect(deriveStatutDiscret([0.999, 0, 0.001])).toEqual({
        statut: StatutAvancementEnum.FAIT,
      });
    });
  });

  describe('arrondiTripletCinqPourcent', () => {
    it('arrondit à l inférieur au pas de 5 % (74 % → 70 %)', () => {
      expect(arrondiTripletCinqPourcent([0.74, 0, 0.26])).toEqual([
        0.7, 0, 0.3,
      ]);
    });

    it('recalcule pas_fait pour compléter à 100 %', () => {
      expect(arrondiTripletCinqPourcent([0.5, 0.5, 0])).toEqual([0.5, 0.5, 0]);
    });
  });

  describe('deriveStatutDetailleAuPourcentage', () => {
    it('retourne detaille avec le triplet arrondi', () => {
      expect(deriveStatutDetailleAuPourcentage([0.7, 0, 0.3])).toEqual({
        statut: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
        statutDetailleAuPourcentage: [0.7, 0, 0.3],
      });
    });
  });

  describe('deriveStatutFromProjection', () => {
    it('retourne NON_CONCERNE sans source concernée', () => {
      expect(
        deriveStatutFromProjection({
          concernedSourceCount: 0,
          pointFait: 0,
          pointProgramme: 0,
          pointPasFait: 0,
          pointPotentiel: 5,
        })
      ).toEqual({ statut: StatutAvancementEnum.NON_CONCERNE });
    });

    it('retourne NON_RENSEIGNE si sources concernées sans avancement', () => {
      expect(
        deriveStatutFromProjection({
          concernedSourceCount: 1,
          pointFait: 0,
          pointProgramme: 0,
          pointPasFait: 0,
          pointPotentiel: 5,
        })
      ).toEqual({ statut: StatutAvancementEnum.NON_RENSEIGNE });
    });

    it('retourne fait pour un triplet discret [1,0,0]', () => {
      expect(
        deriveStatutFromProjection({
          concernedSourceCount: 1,
          pointFait: 5,
          pointProgramme: 0,
          pointPasFait: 0,
          pointPotentiel: 5,
        })
      ).toEqual({ statut: StatutAvancementEnum.FAIT });
    });

    it('retourne fait pour un résidu post-arrondi scoring', () => {
      expect(
        deriveStatutFromProjection({
          concernedSourceCount: 1,
          pointFait: 4.995,
          pointProgramme: 0,
          pointPasFait: 0.005,
          pointPotentiel: 5,
        })
      ).toEqual({ statut: StatutAvancementEnum.FAIT });
    });

    it('retourne detaille + triplet arrondi pour [0.74, 0, 0.26]', () => {
      expect(
        deriveStatutFromProjection({
          concernedSourceCount: 1,
          pointFait: 3.7,
          pointProgramme: 0,
          pointPasFait: 1.3,
          pointPotentiel: 5,
        })
      ).toEqual({
        statut: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
        statutDetailleAuPourcentage: [0.7, 0, 0.3],
      });
    });

    it('retourne detaille pour le bord [0.99, 0, 0.01]', () => {
      expect(
        deriveStatutFromProjection({
          concernedSourceCount: 1,
          pointFait: 4.95,
          pointProgramme: 0,
          pointPasFait: 0.05,
          pointPotentiel: 5,
        })
      ).toEqual({
        statut: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
        statutDetailleAuPourcentage: [0.95, 0, 0.05],
      });
    });
  });
});

describe('mergeStatuts', () => {
  const origineFait = (
    actionId = 'cae_x'
  ): CorrelatedActionWithScore => ({
    referentielId: ReferentielIdEnum.CAE,
    actionId,
    ponderation: 1,
    nom: null,
    score: {
      pointFait: 5,
      pointProgramme: 0,
      pointPasFait: 0,
      pointNonRenseigne: 0,
      pointPotentiel: 5,
      pointReferentiel: 5,
      totalTachesCount: 1,
      faitTachesAvancement: 1,
      programmeTachesAvancement: 0,
      pasFaitTachesAvancement: 0,
      pasConcerneTachesAvancement: 0,
    },
  });

  const createCible = (
    overrides: Partial<ActionCible> & Pick<ActionCible, 'actionId'>
  ): ActionCible => ({
    actionId: overrides.actionId,
    actionType: overrides.actionType ?? ActionTypeEnum.SOUS_ACTION,
    actionsOrigine: overrides.actionsOrigine ?? [],
    originesConcernees: overrides.originesConcernees ?? [],
    originesCommentaire: overrides.originesCommentaire ?? [],
    concernee: overrides.concernee ?? true,
    aDesTachesEnfant: overrides.aDesTachesEnfant ?? false,
    hasExprScore: overrides.hasExprScore ?? false,
  });

  const createCtx = (
    sousActionsEtTaches: ActionCible[],
    teScoreMap: Map<string, ActionScore> = new Map()
  ): SwitchToTeContext => ({
    collectiviteId: 1,
    sourceReferentiels: [ReferentielIdEnum.CAE],
    scoreMapsByReferentiel: new Map(),
    referentielTe: {} as SwitchToTeContext['referentielTe'],
    teScoreMap,
    hierarchiesByReferentielId: new Map(),
    pilotesByMesureActionId: new Map(),
    servicesByMesureActionId: new Map(),
    cibles: { sousActionsEtTaches, mesures: [], commentaires: [] },
    sourceFicheLinks: [],
    correspondanceIndexes: {
      directSousActionByOrigineId: new Map(),
      mesureByOrigineId: new Map(),
    },
  });

  const tePotentiel5 = (actionId: string): Map<string, ActionScore> =>
    new Map([[actionId, { pointPotentiel: 5 } as ActionScore]]);

  /** action TE désactivée par la personnalisation : potentiel à 0 */
  const teDesactivee = (
    actionId: string,
    pointReferentiel = 5
  ): Map<string, ActionScore> =>
    new Map([
      [
        actionId,
        {
          pointPotentiel: 0,
          pointReferentiel,
          concerne: false,
          desactive: true,
        } as ActionScore,
      ],
    ]);

  it("n'émet aucune ligne pour une cible concernée porteuse de tâches", () => {
    const ctx = createCtx(
      [
        createCible({
          actionId: 'te_1.1.1.1',
          concernee: true,
          aDesTachesEnfant: true,
          originesConcernees: [origineFait()],
        }),
      ],
      tePotentiel5('te_1.1.1.1')
    );

    expect(mergeStatuts(ctx)).toEqual([]);
  });

  it('émet une ligne pour une sous-action feuille (non-régression)', () => {
    const ctx = createCtx(
      [
        createCible({
          actionId: 'te_1.1.1.1',
          concernee: true,
          aDesTachesEnfant: false,
          originesConcernees: [origineFait()],
        }),
      ],
      tePotentiel5('te_1.1.1.1')
    );

    expect(mergeStatuts(ctx)).toEqual([
      {
        collectiviteId: 1,
        actionId: 'te_1.1.1.1',
        statut: StatutAvancementEnum.FAIT,
      },
    ]);
  });

  it("n'émet aucune ligne pour une cible désactivée porteuse de tâches", () => {
    const ctx = createCtx(
      [
        createCible({
          actionId: 'te_1.1.1.1',
          concernee: false,
          aDesTachesEnfant: true,
          originesConcernees: [origineFait()],
        }),
      ],
      teDesactivee('te_1.1.1.1')
    );

    expect(mergeStatuts(ctx)).toEqual([]);
  });

  it('ne saute que la cible marquée aDesTachesEnfant', () => {
    const ctx = createCtx(
      [
        createCible({
          actionId: 'te_1.1.1.1',
          concernee: true,
          aDesTachesEnfant: true,
          originesConcernees: [origineFait('cae_parent')],
        }),
        createCible({
          actionId: 'te_1.1.1.1.1',
          concernee: true,
          aDesTachesEnfant: false,
          originesConcernees: [origineFait('cae_tache')],
        }),
      ],
      tePotentiel5('te_1.1.1.1.1')
    );

    expect(mergeStatuts(ctx)).toEqual([
      {
        collectiviteId: 1,
        actionId: 'te_1.1.1.1.1',
        statut: StatutAvancementEnum.FAIT,
      },
    ]);
  });

  it("n'émet aucune ligne pour une tâche avec une origine concernée (pas de projection)", () => {
    const ctx = createCtx(
      [
        createCible({
          actionId: 'te_1.1.1.1.1',
          actionType: ActionTypeEnum.TACHE,
          concernee: true,
          originesConcernees: [origineFait()],
        }),
      ],
      tePotentiel5('te_1.1.1.1.1')
    );

    expect(mergeStatuts(ctx)).toEqual([]);
  });

  it("n'émet aucune ligne pour une sous-action avec exprScore et une origine concernée", () => {
    const ctx = createCtx(
      [
        createCible({
          actionId: 'te_1.1.1.1',
          concernee: true,
          hasExprScore: true,
          originesConcernees: [origineFait()],
        }),
      ],
      tePotentiel5('te_1.1.1.1')
    );

    expect(mergeStatuts(ctx)).toEqual([]);
  });

  it("n'émet aucune ligne pour une sous-action avec exprScore désactivée côté TE", () => {
    const ctx = createCtx(
      [
        createCible({
          actionId: 'te_1.1.1.1',
          concernee: false,
          hasExprScore: true,
          originesConcernees: [origineFait()],
        }),
      ],
      teDesactivee('te_1.1.1.1')
    );

    expect(mergeStatuts(ctx)).toEqual([]);
  });

  it("n'émet aucune ligne pour une sous-action avec exprScore désactivée côté TE sans origine concernée", () => {
    const ctx = createCtx(
      [
        createCible({
          actionId: 'te_1.1.1.1',
          concernee: false,
          hasExprScore: true,
          originesConcernees: [],
        }),
      ],
      teDesactivee('te_1.1.1.1')
    );

    expect(mergeStatuts(ctx)).toEqual([]);
  });

  it("n'émet aucune ligne pour une tâche sans origine concernée", () => {
    const ctx = createCtx(
      [
        createCible({
          actionId: 'te_1.1.1.1.1',
          actionType: ActionTypeEnum.TACHE,
          concernee: true,
          originesConcernees: [],
        }),
      ],
      tePotentiel5('te_1.1.1.1.1')
    );

    expect(mergeStatuts(ctx)).toEqual([]);
  });

  it("n'émet aucune ligne pour une sous-action avec exprScore sans origine concernée", () => {
    const ctx = createCtx(
      [
        createCible({
          actionId: 'te_1.1.1.1',
          concernee: true,
          hasExprScore: true,
          originesConcernees: [],
        }),
      ],
      tePotentiel5('te_1.1.1.1')
    );

    expect(mergeStatuts(ctx)).toEqual([]);
  });

  it("n'émet aucune ligne pour une tâche désactivée côté TE malgré une origine concernée", () => {
    const ctx = createCtx(
      [
        createCible({
          actionId: 'te_1.1.1.1.1',
          actionType: ActionTypeEnum.TACHE,
          concernee: false,
          originesConcernees: [origineFait()],
        }),
      ],
      teDesactivee('te_1.1.1.1.1')
    );

    expect(mergeStatuts(ctx)).toEqual([]);
  });

  describe('sous-action désactivée côté TE le jour de la bascule', () => {
    it('reprend le statut des origines, projeté sur les points référentiel', () => {
      const ctx = createCtx(
        [
          createCible({
            actionId: 'te_1.2.4.1',
            concernee: false,
            originesConcernees: [origineFait('cae_1.3.3.1')],
          }),
        ],
        teDesactivee('te_1.2.4.1')
      );

      expect(mergeStatuts(ctx)).toEqual([
        {
          collectiviteId: 1,
          actionId: 'te_1.2.4.1',
          statut: StatutAvancementEnum.FAIT,
        },
      ]);
    });

    it('reprend un statut détaillé arrondi à 5 % (46 % fait, 28 % programmé → 45 / 25 / 30)', () => {
      const ctx = createCtx(
        [
          createCible({
            actionId: 'te_1.2.4.1',
            concernee: false,
            originesConcernees: [
              {
                ...origineFait('cae_1.3.3.1'),
                score: {
                  pointFait: 0.552,
                  pointProgramme: 0.336,
                  pointPasFait: 0.312,
                  pointNonRenseigne: 0,
                  pointPotentiel: 1.2,
                  pointReferentiel: 1.2,
                  totalTachesCount: 5,
                  faitTachesAvancement: 2.3,
                  programmeTachesAvancement: 1.4,
                  pasFaitTachesAvancement: 1.3,
                  pasConcerneTachesAvancement: 0,
                },
              },
            ],
          }),
        ],
        teDesactivee('te_1.2.4.1', 1.2)
      );

      const [statut] = mergeStatuts(ctx);

      expect(statut.statut).toBe(StatutAvancementEnum.DETAILLE_AU_POURCENTAGE);
      const [fait, programme, pasFait] = statut.statutDetailleAuPourcentage ?? [];
      expect(fait).toBeCloseTo(0.45);
      expect(programme).toBeCloseTo(0.25);
      expect(pasFait).toBeCloseTo(0.3);
    });

    it('émet NON_CONCERNE si aucune origine n\'est concernée', () => {
      const ctx = createCtx(
        [
          createCible({
            actionId: 'te_1.2.4.1',
            concernee: false,
            originesConcernees: [],
          }),
        ],
        teDesactivee('te_1.2.4.1')
      );

      expect(mergeStatuts(ctx)).toEqual([
        {
          collectiviteId: 1,
          actionId: 'te_1.2.4.1',
          statut: StatutAvancementEnum.NON_CONCERNE,
        },
      ]);
    });
  });

  it('émet NON_RENSEIGNE pour une sous-action active dont le potentiel est réduit à 0 (non-régression)', () => {
    const ctx = createCtx(
      [
        createCible({
          actionId: 'te_1.1.1.1',
          concernee: true,
          originesConcernees: [origineFait()],
        }),
      ],
      new Map([
        [
          'te_1.1.1.1',
          { pointPotentiel: 0, pointReferentiel: 5 } as ActionScore,
        ],
      ])
    );

    expect(mergeStatuts(ctx)).toEqual([
      {
        collectiviteId: 1,
        actionId: 'te_1.1.1.1',
        statut: StatutAvancementEnum.NON_RENSEIGNE,
      },
    ]);
  });
});
