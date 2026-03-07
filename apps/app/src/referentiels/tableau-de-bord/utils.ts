import { divisionOrZero } from '@tet/domain/utils';
import { avancementToLabel } from '@/app/app/labels';
import { actionAvancementColors } from '@/app/app/theme';
import type { ActionDetailed } from '../use-snapshot';

/**
 * Met en forme les scores pour les graphes de progression (snapshot format)
 */
export const getFormattedScore = (
  scoreData: readonly ActionDetailed[],
  indexBy: string,
  percentage: boolean,
  customColors: { [key: string]: string }
) => {
  const formattedScore = [];

  if (percentage) {
    formattedScore.push(
      ...scoreData.map((d) => {
        const pp = d.score?.pointPotentiel ?? 0;
        return {
          [indexBy]: `${(d.actionId ?? '').split('_')[1]}`,
          [avancementToLabel.fait]:
            divisionOrZero(d.score?.pointFait ?? 0, pp) * 100,
          [avancementToLabel.programme]:
            divisionOrZero(d.score?.pointProgramme ?? 0, pp) * 100,
          [avancementToLabel.pas_fait]:
            divisionOrZero(d.score?.pointPasFait ?? 0, pp) * 100,
          [avancementToLabel.non_renseigne]:
            divisionOrZero(d.score?.pointNonRenseigne ?? 0, pp) * 100,
          ...customColors,
          clickable: `${d.actionsEnfant?.length > 0}`,
        };
      })
    );

    const totalPointsMaxPersonnalises =
      scoreData.reduce(
        (res, d) => res + (d.score?.pointPotentiel ?? 0),
        0
      ) || 1;

    formattedScore.push({
      [indexBy]: 'Total',
      [avancementToLabel.fait]:
        (scoreData.reduce((res, d) => res + (d.score?.pointFait ?? 0), 0) /
          totalPointsMaxPersonnalises) *
        100,
      [avancementToLabel.programme]:
        (scoreData.reduce(
          (res, d) => res + (d.score?.pointProgramme ?? 0),
          0
        ) /
          totalPointsMaxPersonnalises) *
        100,
      [avancementToLabel.pas_fait]:
        (scoreData.reduce(
          (res, d) =>
            res +
            divisionOrZero(d.score?.pointPasFait ?? 0, d.score?.pointPotentiel ?? 0) *
              (d.score?.pointPotentiel ?? 0),
          0
        ) /
          totalPointsMaxPersonnalises) *
        100,
      [avancementToLabel.non_renseigne]:
        (scoreData.reduce(
          (res, d) =>
            res +
            divisionOrZero(d.score?.pointNonRenseigne ?? 0, d.score?.pointPotentiel ?? 0) *
              (d.score?.pointPotentiel ?? 0),
          0
        ) /
          totalPointsMaxPersonnalises) *
        100,
      ...customColors,
      clickable: 'false',
    });
  } else {
    formattedScore.push(
      ...scoreData.map((d) => {
        const pp = d.score?.pointPotentiel ?? 0;
        return {
          [indexBy]: `${(d.actionId ?? '').split('_')[1]}`,
          [avancementToLabel.fait]: d.score?.pointFait ?? 0,
          [avancementToLabel.programme]: d.score?.pointProgramme ?? 0,
          [avancementToLabel.pas_fait]:
            divisionOrZero(d.score?.pointPasFait ?? 0, pp) * (pp || 1),
          [avancementToLabel.non_renseigne]:
            divisionOrZero(d.score?.pointNonRenseigne ?? 0, pp) * (pp || 1),
          ...customColors,
          clickable: `${d.actionsEnfant?.length > 0}`,
        };
      })
    );
  }

  return formattedScore;
};

export const getAggregatedScore = (
  scoreData: readonly ActionDetailed[]
) => {
  const aggregatedScore: { id: string; value: number; color?: string }[] = [
    { id: avancementToLabel.fait, value: 0, color: actionAvancementColors.fait },
    {
      id: avancementToLabel.programme,
      value: 0,
      color: actionAvancementColors.programme,
    },
    {
      id: avancementToLabel.pas_fait,
      value: 0,
      color: actionAvancementColors.pas_fait,
    },
    {
      id: avancementToLabel.non_renseigne,
      value: 0,
      color: actionAvancementColors.non_renseigne,
    },
  ];

  scoreData.forEach((d) => {
    const pp = d.score?.pointPotentiel ?? 0;
    aggregatedScore[0].value += d.score?.pointFait ?? 0;
    aggregatedScore[1].value += d.score?.pointProgramme ?? 0;
    aggregatedScore[2].value +=
      divisionOrZero(d.score?.pointPasFait ?? 0, pp) * (pp || 1);
    aggregatedScore[3].value +=
      divisionOrZero(d.score?.pointNonRenseigne ?? 0, pp) * (pp || 1);
  });

  return {
    array: aggregatedScore,
    realises: aggregatedScore[0].value,
    programmes: aggregatedScore[1].value,
    pas_fait: aggregatedScore[2].value,
    non_renseigne: aggregatedScore[3].value,
    max_personnalise: scoreData.reduce(
      (res, d) => res + (d.score?.pointPotentiel ?? 0),
      0
    ),
  };
};
