'use client';

import { useMemo } from 'react';
import {
  CellKey,
  generateCellKey,
  GridCell,
  IndicateurValuesGridActions,
} from '@/app/indicateurs/valeurs/grid/types';

type UpdateCells = (
  updater: (previous: Map<CellKey, GridCell>) => Map<CellKey, GridCell>
) => void;

const userDataCell = (
  previous: Map<CellKey, GridCell>,
  key: CellKey,
  value: number | null,
  valueId?: number
): GridCell => ({
  kind: 'user-data',
  value,
  valueId,
  coveringSources: previous.get(key)?.coveringSources ?? [],
});

export const useMockGridActions = (
  updateCells: UpdateCells
): IndicateurValuesGridActions =>
  useMemo<IndicateurValuesGridActions>(
    () => ({
      saveCellValue: async ({ indicateurId, valueId, year, resultat }) => {
        updateCells((previous) => {
          const key = generateCellKey(indicateurId, year);
          return new Map(previous).set(
            key,
            userDataCell(previous, key, resultat, valueId)
          );
        });
        return { ok: true, value: undefined };
      },
      saveCellValues: async (inputs) => {
        updateCells(
          (previous) =>
            new Map<CellKey, GridCell>([
              ...previous,
              ...inputs.map(
                ({ indicateurId, valueId, year, resultat }): [CellKey, GridCell] => {
                  const key = generateCellKey(indicateurId, year);
                  return [key, userDataCell(previous, key, resultat, valueId)];
                }
              ),
            ])
        );
        return { ok: true, value: { written: inputs.length, failed: [] } };
      },
      selectOpenData: async ({ indicateurId, year, sourceId }) => {
        updateCells((previous) => {
          const key = generateCellKey(indicateurId, year);
          const current = previous.get(key);
          const chosen = current?.coveringSources.find(
            (source) => source.sourceId === sourceId
          );
          if (current === undefined || chosen === undefined) {
            return previous;
          }
          return new Map(previous).set(key, {
            kind: 'open-data',
            value: chosen.value,
            selectedSourceId: chosen.sourceId,
            source: {
              sourceId: chosen.sourceId,
              libelle: chosen.libelle,
              methodologie: chosen.methodologie,
              dateVersion: chosen.dateVersion,
            },
            coveringSources: current.coveringSources,
          });
        });
        return { ok: true, value: undefined };
      },
      clearCell: async ({ indicateurId, year }) => {
        updateCells((previous) => {
          const key = generateCellKey(indicateurId, year);
          return new Map(previous).set(
            key,
            userDataCell(previous, key, null)
          );
        });
        return { ok: true, value: undefined };
      },
    }),
    [updateCells]
  );
