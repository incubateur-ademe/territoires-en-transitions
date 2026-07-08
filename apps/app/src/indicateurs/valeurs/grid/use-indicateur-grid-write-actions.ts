'use client';

import { useMemo } from 'react';
import { useCollectiviteId } from '@tet/api/collectivites';
import { toIndicateur } from './adapters/indicateur-grid-adapter';
import {
  CellValueInput,
  IndicateurValuesGridActions,
  Result,
  Year,
} from './types';
import { useUpsertIndicateurValeur } from '@/app/indicateurs/valeurs/use-upsert-indicateur-valeur';

export type IndicateurGridWriteActions = Pick<
  IndicateurValuesGridActions,
  'saveCellValue' | 'saveCellValues' | 'clearCell'
>;

export const useIndicateurGridWriteActions = (
  referenceYear: Year | null
): IndicateurGridWriteActions => {
  const collectiviteId = useCollectiviteId();
  const { mutateAsync } = useUpsertIndicateurValeur();

  return useMemo<IndicateurGridWriteActions>(() => {
    const write = async (input: CellValueInput): Promise<Result> => {
      try {
        await mutateAsync(toIndicateur(input, { collectiviteId, referenceYear }));
        return { ok: true, value: undefined };
      } catch {
        return { ok: false };
      }
    };

    return {
      saveCellValue: write,
      saveCellValues: async (inputs) => {
        const results = await Promise.all(inputs.map(write));
        const failed = inputs.filter((_, index) => !results[index].ok);
        return {
          ok: true,
          value: { written: inputs.length - failed.length, failed },
        };
      },
      clearCell: ({ indicateurId, year }) =>
        write({ indicateurId, year, value: null }),
    };
  }, [mutateAsync, collectiviteId, referenceYear]);
};
