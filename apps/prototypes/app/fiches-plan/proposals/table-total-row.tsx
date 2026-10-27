import { TableCell, TableRow } from '@tet/ui';

/**
 * Proposition : variante de `TableRow`
 * Besoin : une ligne de total en pied de tableau (`tfoot`), sur fond
 * `primary-1` et en gras, qui somme les colonnes chiffrées des lignes
 * affichées. Le design system n'a ni pied de tableau ni ligne de total.
 */
export const TableTotalRow = ({
  label,
  labelColSpan,
  values,
  trailingColSpan = 0,
}: {
  label: string;
  /** Nombre de colonnes couvertes par le libellé. */
  labelColSpan: number;
  /** Totaux, alignés à droite, dans l'ordre des colonnes. */
  values: ReadonlyArray<string>;
  /** Colonnes vides après les totaux. */
  trailingColSpan?: number;
}) => (
  <tfoot>
    <TableRow className="bg-primary-1 even:bg-primary-1 font-bold text-primary-9">
      <th scope="row" colSpan={labelColSpan} className="px-4 py-3 text-left">
        {label}
      </th>
      {values.map((value, index) => (
        <TableCell key={index} className="text-right tabular-nums">
          {value}
        </TableCell>
      ))}
      {trailingColSpan > 0 && <TableCell colSpan={trailingColSpan} />}
    </TableRow>
  </tfoot>
);
