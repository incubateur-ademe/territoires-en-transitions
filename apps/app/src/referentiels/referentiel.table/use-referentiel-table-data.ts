import {
  actionThematiqueSgpeLabels,
  actionThematiqueSgpeValues,
  ActionTypeEnum,
} from '@tet/domain/referentiels';
import { useMemo } from 'react';
import { ActionListItem } from '../actions/use-list-actions';
import { ReferentielThematiqueView } from './use-referentiel-thematique-view';

type Props = {
  thematiqueView: ReferentielThematiqueView;
  actions: Record<string, ActionListItem>;
  referentielId: string;
};

function aggregateScoresFromChildren(childrenActions: ActionListItem[]) {
  let pointPotentiel = 0;
  let pointPotentielPerso: number | null = null;
  let pointReferentiel = 0;
  let pointFait = 0;
  let pointPasFait = 0;
  let pointProgramme = 0;
  let pointNonRenseigne = 0;
  let completedTachesCount = 0;
  let totalTachesCount = 0;
  let faitTachesAvancement = 0;
  let programmeTachesAvancement = 0;
  let pasFaitTachesAvancement = 0;
  let pasConcerneTachesAvancement = 0;

  for (const action of childrenActions) {
    const score = action.score;
    pointPotentiel += score.pointPotentiel ?? 0;
    pointReferentiel += score.pointReferentiel ?? 0;
    pointFait += score.pointFait ?? 0;
    pointPasFait += score.pointPasFait ?? 0;
    pointProgramme += score.pointProgramme ?? 0;
    pointNonRenseigne += score.pointNonRenseigne ?? 0;
    completedTachesCount += score.completedTachesCount ?? 0;
    totalTachesCount += score.totalTachesCount ?? 0;
    faitTachesAvancement += score.faitTachesAvancement ?? 0;
    programmeTachesAvancement += score.programmeTachesAvancement ?? 0;
    pasFaitTachesAvancement += score.pasFaitTachesAvancement ?? 0;
    pasConcerneTachesAvancement += score.pasConcerneTachesAvancement ?? 0;

    if (score.pointPotentielPerso !== null) {
      pointPotentielPerso =
        (pointPotentielPerso ?? 0) + score.pointPotentielPerso;
    }
  }

  return {
    pointPotentiel,
    pointPotentielPerso,
    pointReferentiel,
    pointFait,
    pointPasFait,
    pointProgramme,
    pointNonRenseigne,
    completedTachesCount,
    totalTachesCount,
    faitTachesAvancement,
    programmeTachesAvancement,
    pasFaitTachesAvancement,
    pasConcerneTachesAvancement,
  };
}

export function useReferentielTableData({
  thematiqueView,
  actions,
  referentielId,
}: Props): ActionListItem[] {
  return useMemo(() => {
    if (thematiqueView === 'axes') {
      const referentiel = actions[referentielId];
      return referentiel?.childrenIds.map((id) => actions[id]) ?? [];
    }

    if (thematiqueView === 'sgpe') {
      return actionThematiqueSgpeValues.map((thematique, index) => {
        const filteredActions = Object.values(actions)
          .filter((action) => !!action.thematiqueSgpe)
          .filter((action) => action.thematiqueSgpe === thematique);
        const actionId = `thematique-${thematique}`;
        const aggregatedScores = aggregateScoresFromChildren(filteredActions);

        return {
          actionId,
          actionType: ActionTypeEnum.AXE,
          adaptationNiveau: null,
          categorie: null,
          childrenIds: filteredActions.map((action) => action.actionId),
          childrenIdsWithExprScore: [],
          contexte: '',
          depth: 1,
          description: '',
          exemples: '',
          exprScore: null,
          identifiant: index.toString(),
          level: 1,
          modifiedAt: '',
          nextId: filteredActions[0]?.actionId,
          nom: actionThematiqueSgpeLabels[thematique],
          parentId: 'te',
          perimetreEvaluation: '',
          pilotes: [],
          points: null,
          pourcentage: null,
          preuve: '',
          preuves: null,
          previousId: null,
          questionIds: [],
          reductionPotentiel: '',
          referentiel: 'te',
          referentielId: 'te',
          referentielVersion: filteredActions[0]?.referentielVersion,
          ressources: '',
          score: {
            actionId,
            concerne: true,
            desactive: false,
            renseigne: aggregatedScores.completedTachesCount > 0,
            ...aggregatedScores,
          },
          scoresTag: {},
          services: [],
          tags: [],
          thematiqueSgpe: thematique,
        };
      });
    }

    return [];
  }, [thematiqueView, actions, referentielId]);
}
