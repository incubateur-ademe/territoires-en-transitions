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
}: ScoreDonutTooltipParams): string =>
  `${marker} ${name}: <b>${points} points (${percent}%)</b>`;
