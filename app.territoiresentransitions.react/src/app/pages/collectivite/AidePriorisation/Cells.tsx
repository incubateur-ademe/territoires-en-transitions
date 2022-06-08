import {CellProps} from 'react-table';
import {getMaxDepth, PriorisationRow} from './queries';
import {toLocaleFixed} from 'utils/toFixed';

type TCellProps = CellProps<PriorisationRow> & {referentiel: string | null};

/**
 * Affiche une cellule contenant un pourcentage
 */
export const CellPercent = (props: TCellProps) => {
  const {value} = props;

  return (
    <span className="inline-block w-full text-right">
      {isNaN(value) ? 0 : toLocaleFixed(value * 100)} %
    </span>
  );
};

/**
 * Affiche une cellule contenant un nombre de points
 */
export const CellPoints = (props: TCellProps) => {
  const {value} = props;

  return (
    <span className="inline-block w-full text-right">
      {isNaN(value) ? 0 : toLocaleFixed(value)}
    </span>
  );
};

/**
 * Affiche une cellule contenant la phase de priorisation
 */
export const CellPhase = (props: TCellProps) => {
  const {value, row, referentiel} = props;
  const {depth} = row.original;

  // on n'affiche pas la phase avant le niveau sous-action
  if (depth < getMaxDepth(referentiel)) {
    return null;
  }

  const label = value ? phaseToVerb[value as string] : '';

  return <span>{label || ''}</span>;
};

const phaseToVerb: Record<string, string> = {
  bases: 'S’engager',
  'mise en œuvre': 'Concrétiser',
  effets: 'Consolider',
};
