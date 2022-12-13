import {CellProps} from 'react-table';
import {getMaxDepth, PriorisationRow} from './queries';
import {toLocaleFixed} from 'utils/toFixed';
import {ReactComponent as Up} from './up.svg';
import {ReactComponent as Down} from './down.svg';

const PICTOS = {
  up: Up,
  down: Down,
};

const PICTO_COLORS = {
  up: {
    default: '#18753C',
    alt: '#B8FEC9',
  },
  down: {
    default: '#CE0500',
    alt: '#FFE8E5',
  },
};

type TCellProps = CellProps<PriorisationRow> & {
  referentiel: string | null;
  difference?: keyof typeof PICTOS;
};
type TCellValueProps = Pick<TCellProps, 'value' | 'difference'>;

const isNullable = (value: number | undefined | null): boolean =>
  !value || isNaN(value);

/**
 * Affiche une cellule contenant une valeur, éventuellemeent précédée d'un picto
 * up/down pour refléter que cette valeur a augmentée ou diminuée par rapport à
 * sa valeur antérieure.
 */
const CellValue = (
  props: Omit<TCellValueProps, 'value'> & {
    children: any;
    row?: TCellProps['row'];
  }
) => {
  const {children, difference, row} = props;
  const Picto = difference ? PICTOS[difference] : null;
  const fill = difference
    ? PICTO_COLORS[difference][
        row && (row.original.type === 'axe' || row.original.type === 'sous-axe')
          ? 'alt'
          : 'default'
      ]
    : null;

  return (
    <span
      className={'cell-value flex justify-end items-baseline w-full text-right'}
    >
      {Picto ? (
        <Picto style={fill ? {fill, marginRight: 6} : undefined} />
      ) : null}
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
