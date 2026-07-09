import { ActionDetailed } from '@/app/referentiels/use-snapshot';
import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import { ActionTypeEnum } from '@tet/domain/referentiels';
import { CellProps } from 'react-table';
import Down from './down.svg';
import Up from './up.svg';

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

type TCellProps = CellProps<ActionDetailed> & {
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
  const { children, difference, row } = props;
  const Picto = difference ? PICTOS[difference] : null;
  const fill = difference
    ? PICTO_COLORS[difference][
        row &&
        (row.original.actionType === ActionTypeEnum.AXE ||
          row.original.actionType === ActionTypeEnum.SOUS_AXE)
          ? 'alt'
          : 'default'
      ]
    : null;

  return (
    <span
      className={'cell-value flex justify-end items-baseline w-full text-right'}
    >
      {Picto ? (
        <Picto style={fill ? { fill, marginRight: 6 } : undefined} />
      ) : null}
      {children}
    </span>
  );
};

/**
 * Affiche une cellule contenant un pourcentage
 */
export const CellPercent = (props: TCellValueProps) => {
  const { value } = props;

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
  const { value } = props;

  return (
    <CellValue {...props}>
      {isNullable(value) ? 0 : toLocaleFixed(value)}
    </CellValue>
  );
};
