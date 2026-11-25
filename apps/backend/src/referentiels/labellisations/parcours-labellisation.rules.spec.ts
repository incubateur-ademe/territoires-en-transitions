import {
  ActionScoreFinal,
  EtoileActionConditionDefinition,
  LabellisationEtoileDefinition,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { ParcoursLabellisationRules } from './parcours-labellisation.rules';

// Le seuil synthétique de 90 % vérifie que les définitions fournies priment.
const etoilesDefinitions: LabellisationEtoileDefinition[] = (
  [
    [5, 0.9],
    [4, 0.65],
    [3, 0.5],
    [2, 0.35],
    [1, 0],
  ] as const
).map(([etoile, minRealiseScore]) => ({
  etoile,
  prochaineEtoile: null,
  longLabel: `${etoile} étoiles`,
  shortLabel: `${etoile}`,
  minRealisePercentage: minRealiseScore * 100,
  minRealiseScore,
}));

const condition: Omit<
  EtoileActionConditionDefinition,
  'minRealiseScore' | 'minProgrammeScore'
> = {
  etoile: 1,
  priorite: 1,
  referentielId: 'eci',
  actionId: 'eci_2.1.0',
  formulation: 'Mettre en oeuvre la mesure',
  minRealisePercentage: 100,
  minProgrammePercentage: null,
};

const buildScore = (
  actionId: string,
  overrides: Partial<ActionScoreFinal> = {}
): ActionScoreFinal => ({
  actionId,
  pointReferentiel: 10,
  pointPotentiel: 10,
  pointPotentielPerso: null,
  pointFait: 0,
  pointProgramme: 0,
  pointPasFait: 0,
  pointNonRenseigne: 10,
  totalTachesCount: 1,
  completedTachesCount: 0,
  faitTachesAvancement: 0,
  programmeTachesAvancement: 0,
  pasFaitTachesAvancement: 0,
  pasConcerneTachesAvancement: 0,
  concerne: true,
  desactive: false,
  renseigne: false,
  ...overrides,
});

const buildTree = ({
  parent = {},
  action = {},
}: {
  parent?: Partial<ActionScoreFinal>;
  action?: Partial<ActionScoreFinal>;
} = {}) => ({
  actionId: 'eci_2.1',
  score: buildScore('eci_2.1', parent),
  actionsEnfant: [
    {
      actionId: condition.actionId,
      score: buildScore(condition.actionId, action),
      actionsEnfant: [],
    },
  ],
});

describe('ParcoursLabellisationRules', () => {
  describe('getEtoileCible', () => {
    const input = {
      etoilesDefinitions,
      currentEtoile: undefined,
      nextEtoile: undefined,
      etoileVisee: undefined,
    };

    test.each([
      { scoreFait: 0, etoile: 1 },
      { scoreFait: 0.899, etoile: 4 },
      { scoreFait: 0.9, etoile: 5 },
    ])(
      'score $scoreFait : utilise le seuil fourni pour $etoile étoiles',
      ({ scoreFait, etoile }) => {
        expect(
          ParcoursLabellisationRules.getEtoileCible({ ...input, scoreFait })
        ).toEqual(
          etoilesDefinitions.find((definition) => definition.etoile === etoile)
        );
      }
    );

    test('conserve une étoile obtenue supérieure à celle permise par le score', () => {
      expect(
        ParcoursLabellisationRules.getEtoileCible({
          ...input,
          currentEtoile: 5,
          scoreFait: 0.1,
        }).etoile
      ).toBe(5);
    });

    test("signale l'absence de définition pour l'étoile cible", () => {
      expect(() =>
        ParcoursLabellisationRules.getEtoileCible({
          ...input,
          etoilesDefinitions: [],
          scoreFait: null,
        })
      ).toThrow('Étoile cible 1 introuvable');
    });
  });

  describe('buildCriteresAction', () => {
    test.each([
      { parentFait: 0, actionFait: 10, atteint: false },
      { parentFait: 10, actionFait: 0, atteint: true },
    ])(
      'le parent renseigné décide du critère ($parentFait points faits), les proportions restent celles de la sous-action',
      ({ parentFait, actionFait, atteint }) => {
        const criteres = ParcoursLabellisationRules.buildCriteresAction({
          actionScoresTree: buildTree({
            parent: {
              avancement: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
              pointFait: parentFait,
            },
            action: { pointFait: actionFait },
          }),
          actionConditionDefinitions: [condition],
        });

        expect(criteres).toEqual([
          {
            ...condition,
            atteint,
            proportionFait: actionFait / 10,
            proportionProgramme: 0,
            reponseAttendue: { kind: 'statut-fait' },
          },
        ]);
      }
    );

    test.each([
      {
        label: 'non concerné',
        parent: { concerne: false, avancement: StatutAvancementEnum.PAS_FAIT },
      },
      { label: 'sans avancement', parent: {} },
      {
        label: 'non renseigné',
        parent: { avancement: StatutAvancementEnum.NON_RENSEIGNE },
      },
    ])('utilise la sous-action quand le parent est $label', ({ parent }) => {
      expect(
        ParcoursLabellisationRules.buildCriteresAction({
          actionScoresTree: buildTree({ parent, action: { pointFait: 10 } }),
          actionConditionDefinitions: [condition],
        })
      ).toMatchObject([{ atteint: true }]);
    });

    test.each([
      { minProgrammePercentage: 80, atteint: true },
      { minProgrammePercentage: 81, atteint: false },
      { minProgrammePercentage: null, atteint: false },
    ])(
      'fait + programmé : seuil $minProgrammePercentage, atteint $atteint',
      ({ minProgrammePercentage, atteint }) => {
        expect(
          ParcoursLabellisationRules.buildCriteresAction({
            actionScoresTree: buildTree({
              action: { pointFait: 4, pointProgramme: 4 },
            }),
            actionConditionDefinitions: [
              { ...condition, minProgrammePercentage },
            ],
          })
        ).toMatchObject([
          { atteint, proportionFait: 0.4, proportionProgramme: 0.4 },
        ]);
      }
    );

    test('accepte aussi le score programmé du parent renseigné', () => {
      expect(
        ParcoursLabellisationRules.buildCriteresAction({
          actionScoresTree: buildTree({
            parent: {
              avancement: StatutAvancementEnum.PROGRAMME,
              pointProgramme: 10,
            },
          }),
          actionConditionDefinitions: [
            { ...condition, minProgrammePercentage: 100 },
          ],
        })
      ).toMatchObject([
        { atteint: true, proportionFait: 0, proportionProgramme: 0 },
      ]);
    });

    test('exclut une action désactivée par la personnalisation', () => {
      expect(
        ParcoursLabellisationRules.buildCriteresAction({
          actionScoresTree: buildTree({
            action: { desactive: true, pointFait: 10 },
          }),
          actionConditionDefinitions: [condition],
        })
      ).toEqual([]);
    });
  });
});
