import classNames from 'classnames';
import {
  TBodyProps,
  TCellProps,
  THeadProps,
  TRowProps,
  TableProps,
} from './types';

/**
 * Affiche un tableau
 * @deprecated Utiliser les composants de Table à la place
 */
export const DEPRECATED_Table = (props: TableProps) => {
  const { children, className } = props;
  return (
    <div
      className={classNames(
        'relative overflow-x-auto rounded-lg border border-primary-3',
        className
      )}
    >
      <table className="w-full">{children}</table>
    </div>
  );
};

/**
 * Affiche un en-tête de tableau
 * @deprecated Utiliser les composants de Table à la place
 */
export const DEPRECATED_THead = (props: THeadProps) => {
  const { children, className } = props;
  return (
    <thead
      className={classNames(
        'bg-primary-2 border-b-2 border-primary-4',
        className
      )}
    >
      {children}
    </thead>
  );
};

/**
 * Affiche une ligne d'en-tête de tableau
 * @deprecated Utiliser les composants de Table à la place
 */
export const DEPRECATED_THeadRow = (props: TRowProps) => {
  const { children, className } = props;
  return <tr className={className}>{children}</tr>;
};

/**
 * @deprecated Utiliser les composants de Table à la place
 */
export const DEPRECATED_HEAD_CELL_STYLE =
  'px-5 py-4 [&:not(:last-child)]:border-r border-primary-4 text-primary-9 text-xs';

/**
 * Affiche une cellule d'en-tête de tableau
 * @deprecated Utiliser les composants de Table à la place
 */
export const DEPRECATED_THeadCell = (props: TCellProps) => {
  const { children, className } = props;
  return (
    <th
      scope="col"
      className={classNames(DEPRECATED_HEAD_CELL_STYLE, className)}
    >
      {children}
    </th>
  );
};

/**
 * Affiche un corps de tableau
 * @deprecated Utiliser les composants de Table à la place
 */
export const DEPRECATED_TBody = (props: TBodyProps) => {
  const { children, className } = props;
  return <tbody className={className}>{children}</tbody>;
};

/**
 * Affiche une ligne de tableau
 * @deprecated Utiliser les composants de Table à la place
 */
export const DEPRECATED_TRow = (props: TRowProps) => {
  const { children, className } = props;
  return (
    <tr
      className={classNames(
        '[&:not(:last-child)]:border-b border-primary-4',
        className
      )}
    >
      {children}
    </tr>
  );
};

/**
 * Affiche une cellule de tableau
 * @deprecated Utiliser les composants de Table à la place
 */
export const DEPRECATED_TCell = (props: TCellProps) => {
  const { children, className, variant, colSpan } = props;
  return (
    <td
      scope="col"
      colSpan={colSpan}
      className={classNames(
        'px-5 [&:not(:last-child)]:border-r border-primary-4 text-sm',
        {
          'font-bold text-primary-10 text-left': variant === 'title',
          'font-bold text-primary-8 text-center': variant === 'number',
          'py-4': variant !== 'input',
          'py-1': variant === 'input',
        },
        className
      )}
    >
      {children}
    </td>
  );
};
