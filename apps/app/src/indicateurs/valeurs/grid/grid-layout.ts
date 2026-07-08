import { sortBy } from 'es-toolkit';
import {
  GridGroups,
  GridRow,
  toIndicateurId,
} from './types';

export type GridLayout = Record<string, Record<string, string>>;

export type RowOrder = Record<string, string[]>;

export const layoutToGridGroups = (
  layout: GridLayout,
  idByIdentifiant: Map<string, number>
): GridGroups =>
  Object.fromEntries(
    Object.entries(layout).map(([groupLabel, rowsByLabel]) => [
      groupLabel,
      {
        label: groupLabel,
        rows: Object.entries(rowsByLabel).flatMap(
          ([rowLabel, identifiant]): GridRow[] => {
            const indicateurId = idByIdentifiant.get(identifiant);
            return indicateurId === undefined
              ? []
              : [{ indicateurId: toIndicateurId(indicateurId), label: rowLabel }];
          }
        ),
      },
    ])
  );

export const layoutIdentifiants = (layout: GridLayout): string[] =>
  Object.values(layout).flatMap((rowsByLabel) => Object.values(rowsByLabel));

export const applyRowOrder = (
  layout: GridLayout,
  rowOrder: RowOrder
): GridLayout =>
  Object.fromEntries(
    Object.entries(layout).map(
      ([groupLabel, rowsByLabel]): [string, Record<string, string>] => {
        const order = rowOrder[groupLabel];
        if (order === undefined) {
          return [groupLabel, rowsByLabel];
        }
        const positionByIdentifiant = new Map(
          order.map((identifiant, index): [string, number] => [
            identifiant,
            index,
          ])
        );
        const entries = Object.entries(rowsByLabel);
        return [
          groupLabel,
          Object.fromEntries(
            sortBy(entries, [
              ([, identifiant]) =>
                positionByIdentifiant.get(identifiant) ?? entries.length,
            ])
          ),
        ];
      }
    )
  );
