import { getPercentage } from './utils';

type DonutTooltipProps = {
  id: string;
  value: number;
  color: string;
  /** Toutes les valeurs du graphe, pour le calcul du pourcentage */
  values: number[];
  unit?: string;
};

/** Tooltip par défaut du composant Donut */
export const DonutTooltip = ({
  id,
  value,
  color,
  values,
  unit,
}: DonutTooltipProps) => (
  <div className="flex items-center gap-2 text-sm">
    {/** Pastille de couleur */}
    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
    {/**  Valeur */}
    <span>
      {`${id} : `}
      <strong>
        {`${Math.round(value * 10) / 10} ${unit ?? ''}${
          !!unit && value > 1 ? 's' : ''
        } (${getPercentage(value, values)}%)`}
      </strong>
    </span>
  </div>
);
