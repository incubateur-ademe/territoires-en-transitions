import { CorrelatedActionWithScore } from '@tet/backend/referentiels/correlated-actions/referentiel-action-origine-with-score.dto';
import {
  getRatioFromOrigineActions,
  getScoreFromOrigineActionsAndRatio,
} from './score-from-origines.rules';

describe('score-from-origines.rules', () => {
  describe('getScoreFromOrigineActionsAndRatio', () => {
    it('Standard test avec ponderation', () => {
      const origineActions: CorrelatedActionWithScore[] = [
        {
          referentielId: 'cae',
          actionId: 'cae_1.1.2.2.3',
          ponderation: 1,
          nom: null,
          score: {
            pointPotentiel: 0.8,
            pointFait: 0.8,
            pointProgramme: 0,
            pointPasFait: 0,
            pointNonRenseigne: 0,
            pointReferentiel: 0.8,
            totalTachesCount: 1,
            faitTachesAvancement: 1,
            programmeTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
        },
        {
          referentielId: 'cae',
          actionId: 'cae_1.1.2.2.5',
          ponderation: 1,
          nom: null,
          score: {
            pointPotentiel: 0.8,
            pointFait: 0.8,
            pointProgramme: 0,
            pointPasFait: 0,
            pointNonRenseigne: 0,
            pointReferentiel: 0.8,
            totalTachesCount: 1,
            faitTachesAvancement: 1,
            programmeTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
        },
        {
          referentielId: 'cae',
          actionId: 'cae_1.1.2.2.1',
          ponderation: 1,
          nom: null,
          score: {
            pointPotentiel: 0.8,
            pointFait: 0.8,
            pointProgramme: 0,
            pointPasFait: 0,
            pointNonRenseigne: 0,
            pointReferentiel: 0.8,
            totalTachesCount: 1,
            faitTachesAvancement: 1,
            programmeTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
        },
        {
          referentielId: 'cae',
          actionId: 'cae_1.1.2.2.2',
          ponderation: 0.5,
          nom: null,
          score: {
            pointPotentiel: 0.8,
            pointFait: 0,
            pointProgramme: 0,
            pointPasFait: 0,
            pointNonRenseigne: 0.8,
            pointReferentiel: 0.8,
            totalTachesCount: 1,
            faitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
        },
      ];

      const referentielPointsPotentiels = 3;

      const ratio = getRatioFromOrigineActions(
        origineActions,
        referentielPointsPotentiels
      );
      expect(ratio).toEqual(3 / (0.8 + 0.8 + 0.8 + 0.8 * 0.5));

      const score = getScoreFromOrigineActionsAndRatio(
        ratio,
        origineActions,
        3,
        referentielPointsPotentiels
      );
      expect(score).toEqual({
        pointFait: 2.571,
        pointNonRenseigne: 0.429,
        pointPasFait: 0,
        pointProgramme: 0,
      });
    });

    it("La réduction de potentiel des actions d'origine doit être ignorée, on ne considère que l'avancement", () => {
      const origineActions: CorrelatedActionWithScore[] = [
        {
          referentielId: 'cae',
          actionId: 'cae_3.1.1.1',
          ponderation: 1,
          nom: null,
          score: {
            pointPotentiel: 0.4,
            pointFait: 0.4,
            pointProgramme: 0,
            pointPasFait: 0,
            pointNonRenseigne: 0,
            pointReferentiel: 2,
            totalTachesCount: 4,
            faitTachesAvancement: 4,
            programmeTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
        },
      ];

      const referentielPointsPotentiels = 1.2;

      const ratio = getRatioFromOrigineActions(
        origineActions,
        referentielPointsPotentiels
      );
      expect(ratio).toEqual(1.2 / 2);

      const score = getScoreFromOrigineActionsAndRatio(
        ratio,
        origineActions,
        3,
        referentielPointsPotentiels
      );
      expect(score).toEqual({
        pointFait: 1.2,
        pointNonRenseigne: 0,
        pointPasFait: 0,
        pointProgramme: 0,
      });
    });
  });
});
