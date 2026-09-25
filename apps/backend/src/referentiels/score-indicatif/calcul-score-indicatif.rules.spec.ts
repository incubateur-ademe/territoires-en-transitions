import { EvaluationContext } from '@tet/backend/indicateurs/valeurs/indicateur-expression.service';
import { ReferencedIndicateur } from '@tet/backend/indicateurs/valeurs/referenced-indicateur.dto';
import { IndicateurAssocie, ValeurUtilisee } from '@tet/domain/referentiels';
import { buildCalculScoreIndicatif } from './calcul-score-indicatif.rules';

const associe = (
  indicateurId: number,
  identifiantReferentiel: string
): IndicateurAssocie => ({
  actionId: 'cae_1.1.1',
  indicateurId,
  identifiantReferentiel,
  titre: '',
  unite: '',
  isApplicable: true,
});

const valeurFait = (overrides: Partial<ValeurUtilisee>): ValeurUtilisee => ({
  actionId: 'cae_1.1.1',
  indicateurId: 1,
  indicateurValeurId: 1,
  valeur: 80,
  dateValeur: '2020-01-01',
  typeScore: 'fait',
  sourceLibelle: null,
  sourceMetadonnee: null,
  ...overrides,
});

const ref = (
  identifiant: string,
  tokens: string[],
  progressions?: ReferencedIndicateur['progressions']
): ReferencedIndicateur => ({
  identifiant,
  optional: false,
  tokens,
  progressions,
});

const evaluationContext: EvaluationContext = {
  valeursComplementaires: {
    cible: { cae_1: 10 },
    limite: { cae_1: 50 },
  },
  valeursProgression: {
    cae_1: {
      2015: { objectifSnbc: 200, resultatDepart: 100 },
      2020: { objectifSnbc: 150 },
    },
  },
};

describe('buildCalculScoreIndicatif', () => {
  const indicateursAssocies = [associe(1, 'cae_1')];

  test('presence_absence pour une formule `est_suivi(...)`', () => {
    expect(
      buildCalculScoreIndicatif({
        references: [ref('cae_1', ['est_suivi'])],
        indicateursAssocies,
        evaluationContext,
        valeursUtiliseesFait: [],
      })
    ).toEqual({ type: 'presence_absence' });
  });

  test('valeur_cible_seuil pour une formule `cible(...)`/`limite(...)`', () => {
    expect(
      buildCalculScoreIndicatif({
        references: [ref('cae_1', ['val', 'cible', 'limite'])],
        indicateursAssocies,
        evaluationContext,
        valeursUtiliseesFait: [],
      })
    ).toEqual({
      type: 'valeur_cible_seuil',
      identifiantReferentiel: 'cae_1',
      cible: 10,
      seuil: 50,
    });
  });

  test('valeur_cible_seuil avec cible/seuil absents', () => {
    expect(
      buildCalculScoreIndicatif({
        references: [ref('cae_1', ['limite'])],
        indicateursAssocies,
        evaluationContext: {},
        valeursUtiliseesFait: [],
      })
    ).toEqual({
      type: 'valeur_cible_seuil',
      identifiantReferentiel: 'cae_1',
      cible: null,
      seuil: null,
    });
  });

  test('progression_snbc avec la valeur fait sélectionnée', () => {
    expect(
      buildCalculScoreIndicatif({
        references: [
          ref(
            'cae_1',
            ['progression_snbc'],
            [{ token: 'progression_snbc', anneeDepart: 2015 }]
          ),
        ],
        indicateursAssocies,
        evaluationContext,
        valeursUtiliseesFait: [valeurFait({})],
      })
    ).toEqual({
      type: 'progression_snbc',
      identifiantReferentiel: 'cae_1',
      anneeDepart: 2015,
      objectifSnbcDepart: 200,
      anneeUtilisee: 2020,
      valeurUtilisee: 80,
      objectifSnbc: 150,
    });
  });

  test("retient la même valeur fait que l'évaluation quand plusieurs sont sélectionnées", () => {
    expect(
      buildCalculScoreIndicatif({
        references: [
          ref(
            'cae_1',
            ['progression_snbc'],
            [{ token: 'progression_snbc', anneeDepart: 2015 }]
          ),
        ],
        indicateursAssocies,
        evaluationContext,
        valeursUtiliseesFait: [
          valeurFait({
            indicateurValeurId: 1,
            valeur: 90,
            dateValeur: '2015-01-01',
          }),
          valeurFait({
            indicateurValeurId: 2,
            valeur: 80,
            dateValeur: '2020-01-01',
          }),
        ],
      })
    ).toMatchObject({
      anneeUtilisee: 2020,
      valeurUtilisee: 80,
      objectifSnbc: 150,
    });
  });

  test('reduction avec la valeur cible calculée', () => {
    expect(
      buildCalculScoreIndicatif({
        references: [
          ref(
            'cae_1',
            ['reduction'],
            [
              {
                token: 'reduction',
                anneeDepart: 2015,
                anneeCible: 2025,
                reductionCible: 0.4,
              },
            ]
          ),
        ],
        indicateursAssocies,
        evaluationContext,
        valeursUtiliseesFait: [valeurFait({})],
      })
    ).toEqual({
      type: 'reduction',
      identifiantReferentiel: 'cae_1',
      anneeDepart: 2015,
      resultatDepart: 100,
      anneeCible: 2025,
      reductionCible: 0.4,
      anneeUtilisee: 2020,
      valeurUtilisee: 80,
      // 100 * (1 - 0.4 * 0.5)
      valeurCible: 80,
    });
  });

  test('reduction sans valeur fait sélectionnée', () => {
    expect(
      buildCalculScoreIndicatif({
        references: [
          ref(
            'cae_1',
            ['reduction'],
            [
              {
                token: 'reduction',
                anneeDepart: 2015,
                anneeCible: 2025,
                reductionCible: 0.4,
              },
            ]
          ),
        ],
        indicateursAssocies,
        evaluationContext,
        valeursUtiliseesFait: [],
      })
    ).toMatchObject({
      type: 'reduction',
      resultatDepart: 100,
      anneeUtilisee: null,
      valeurUtilisee: null,
      valeurCible: null,
    });
  });

  test.each([
    ['anneeCible', { anneeCible: undefined, reductionCible: 0.4 }],
    ['reductionCible', { anneeCible: 2025, reductionCible: undefined }],
  ])(
    'reduction sans %s : null, sans retomber sur cible/limite ni est_suivi',
    (_manquant, params) => {
      expect(
        buildCalculScoreIndicatif({
          references: [
            ref(
              'cae_1',
              ['reduction', 'est_suivi', 'cible'],
              [{ token: 'reduction', anneeDepart: 2015, ...params }]
            ),
          ],
          indicateursAssocies,
          evaluationContext,
          valeursUtiliseesFait: [valeurFait({})],
        })
      ).toBeNull();
    }
  );

  test('progression_snbc sans valeur fait sélectionnée', () => {
    expect(
      buildCalculScoreIndicatif({
        references: [
          ref(
            'cae_1',
            ['progression_snbc'],
            [{ token: 'progression_snbc', anneeDepart: 2015 }]
          ),
        ],
        indicateursAssocies,
        evaluationContext,
        valeursUtiliseesFait: [],
      })
    ).toEqual({
      type: 'progression_snbc',
      identifiantReferentiel: 'cae_1',
      anneeDepart: 2015,
      objectifSnbcDepart: 200,
      anneeUtilisee: null,
      valeurUtilisee: null,
      objectifSnbc: null,
    });
  });

  test("progression_snbc ignore la valeur fait d'un autre indicateur", () => {
    expect(
      buildCalculScoreIndicatif({
        references: [
          ref(
            'cae_1',
            ['progression_snbc'],
            [{ token: 'progression_snbc', anneeDepart: 2015 }]
          ),
        ],
        indicateursAssocies,
        evaluationContext,
        valeursUtiliseesFait: [valeurFait({ indicateurId: 2 })],
      })
    ).toMatchObject({
      type: 'progression_snbc',
      anneeUtilisee: null,
      valeurUtilisee: null,
      objectifSnbc: null,
    });
  });

  test('la progression prime sur est_suivi et cible/limite', () => {
    expect(
      buildCalculScoreIndicatif({
        references: [
          ref(
            'cae_1',
            ['est_suivi', 'cible', 'progression_snbc'],
            [{ token: 'progression_snbc', anneeDepart: 2015 }]
          ),
        ],
        indicateursAssocies,
        evaluationContext,
        valeursUtiliseesFait: [],
      })?.type
    ).toBe('progression_snbc');
  });

  test('cible/limite prime sur est_suivi', () => {
    expect(
      buildCalculScoreIndicatif({
        references: [ref('cae_1', ['est_suivi', 'val', 'cible'])],
        indicateursAssocies,
        evaluationContext,
        valeursUtiliseesFait: [],
      })?.type
    ).toBe('valeur_cible_seuil');
  });

  test('ignore les références à des indicateurs non associés', () => {
    expect(
      buildCalculScoreIndicatif({
        references: [ref('cae_1_dom', ['cible']), ref('cae_1', ['est_suivi'])],
        indicateursAssocies,
        evaluationContext,
        valeursUtiliseesFait: [],
      })
    ).toEqual({ type: 'presence_absence' });
  });

  test('null pour une formule sans fonction reconnue', () => {
    expect(
      buildCalculScoreIndicatif({
        references: [ref('cae_1', ['val'])],
        indicateursAssocies,
        evaluationContext,
        valeursUtiliseesFait: [],
      })
    ).toBeNull();
  });
});
