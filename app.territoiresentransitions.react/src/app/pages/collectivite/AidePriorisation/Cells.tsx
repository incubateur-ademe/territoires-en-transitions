import {CellProps} from 'react-table';
import {getMaxDepth, PriorisationRow} from './queries';
import {toLocaleFixed} from 'utils/toFixed';
import classNames from 'classnames';

type TCellProps = CellProps<PriorisationRow> & {
  referentiel: string | null;
  modified?: boolean;
};
type TCellValueProps = Pick<TCellProps, 'value' | 'modified'>;

const isNullable = (value: number | undefined | null): boolean =>
  !value || isNaN(value);

/**
 * Affiche une cellule contenant une valeur
 */
const CellValue = (props: Omit<TCellValueProps, 'value'> & {children: any}) => {
  const {children, modified} = props;

  return (
    <span
      className={classNames('cell-value inline-block w-full text-right', {
        modified,
      })}
    >
      {children}
    </span>
  );
};

/**
 * Affiche une cellule contenant un pourcentage
 */
export const CellPercent = (props: TCellValueProps) => {
  const {value} = props;

  return (
    <CellValue {...props}>
      {isNullable(value) ? 0 : toLocaleFixed(value * 100)} %
    </CellValue>
  );
};

/**
 * Affiche une cellule contenant un nombre de points
 */
export const CellPoints = (props: TCellValueProps) => {
  const {value} = props;

  return (
    <CellValue {...props}>
      {isNullable(value) ? 0 : toLocaleFixed(value)}
    </CellValue>
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
