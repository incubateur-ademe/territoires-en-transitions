import { sortBy } from 'es-toolkit';
import { GridGroups, GridRow, toIndicateurId } from './types';

export type IndicateurGridShape = Record<string, Record<string, string>>;

export type RowOrder = Record<string, string[]>;

export const shapeToGridGroups = (
  shape: IndicateurGridShape,
  indicateurIdByIdentifiantReferentiel: Map<string, number>
): GridGroups =>
  Object.fromEntries(
    Object.entries(shape).map(([groupLabel, rowsByLabel]) => [
      groupLabel,
      {
        label: groupLabel,
        rows: Object.entries(rowsByLabel).flatMap(
          ([rowLabel, identifiant]): GridRow[] => {
            const indicateurId = indicateurIdByIdentifiantReferentiel.get(identifiant);
            return indicateurId === undefined
              ? []
              : [{ indicateurId: toIndicateurId(indicateurId), label: rowLabel }];
          }
        ),
      },
    ])
  );

export const shapeIdentifiants = (shape: IndicateurGridShape): string[] =>
  Object.values(shape).flatMap((rowsByLabel) => Object.values(rowsByLabel));

export const applyRowOrder = (
  shape: IndicateurGridShape,
  rowOrder: RowOrder
): IndicateurGridShape =>
  Object.fromEntries(
    Object.entries(shape).map(
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
