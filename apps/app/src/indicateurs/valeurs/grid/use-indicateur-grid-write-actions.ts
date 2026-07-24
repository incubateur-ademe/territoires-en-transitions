'use client';

import { useMemo } from 'react';
import { useCollectiviteId } from '@tet/api/collectivites';
import { toIndicateur } from './adapters/indicateur-grid-adapter';
import {
  CellValueInput,
  IndicateurValuesGridActions,
  Result,
} from './types';
import { useUpsertIndicateurValeur } from '@/app/indicateurs/valeurs/use-upsert-indicateur-valeur';

export type IndicateurGridWriteActions = Pick<
  IndicateurValuesGridActions,
  'saveCellValue' | 'saveCellValues'
>;

export const useIndicateurGridWriteActions = (): IndicateurGridWriteActions => {
  const collectiviteId = useCollectiviteId();
  const { mutateAsync } = useUpsertIndicateurValeur();

  return useMemo<IndicateurGridWriteActions>(() => {
    const write = async (input: CellValueInput): Promise<Result> => {
      try {
        await mutateAsync(toIndicateur(input, { collectiviteId }));
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
    };
  }, [mutateAsync, collectiviteId]);
};
