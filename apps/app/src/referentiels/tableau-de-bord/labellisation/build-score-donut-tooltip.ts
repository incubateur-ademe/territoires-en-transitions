import { appLabels } from '@/app/labels/catalog';
import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import { round } from 'es-toolkit';

const POINTS_PRECISION = 1;

type ScoreDonutTooltipParams = {
  marker: string;
  name: string;
  points: number;
  percent: number;
};

export const buildScoreDonutTooltip = ({
  marker,
  name,
  points,
  percent,
}: ScoreDonutTooltipParams): string => {
  const roundedPoints = round(points, POINTS_PRECISION);

  return `${marker} ${name}: <b>${appLabels.pointsFormates({
    formattedValue: toLocaleFixed(roundedPoints, POINTS_PRECISION),
    count: roundedPoints,
  })} (${percent}%)</b>`;
};
