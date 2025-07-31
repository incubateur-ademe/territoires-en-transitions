import { PieTooltipProps } from '@nivo/pie';

import { DonutData } from './DonutChart';
import { getPercentage } from './utils';

/** Tooltip par défaut du composant Donut */
export const getDonutTooltip = (
  { datum: { id, value, color } }: PieTooltipProps<Record<string, unknown>>,
  data: DonutData[],
  unit?: string
) => {
  return (
    <div className="flex items-center gap-2 py-2 px-3 text-sm bg-white border border-gray-4">
      {/** Pastille de couleur */}
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      {/**  Valeur */}
      <span>
        {id} :{' '}
        <strong>
          {Math.round(value * 10) / 10} {unit}
          {!!unit && value > 1 ? 's' : ''} (
          {getPercentage(
            value,
            data.map((d) => d.value)
          )}
          %)
        </strong>
      </span>
    </div>
  );
};
