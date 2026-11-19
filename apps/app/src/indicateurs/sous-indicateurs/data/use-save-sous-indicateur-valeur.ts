import { useCollectiviteId } from '@tet/api/collectivites';
import type { IndicateurPeriode } from '@tet/domain/indicateurs';
import { useCallback } from 'react';
import type { IndicateurValeurField } from '../../valeurs/grid/types';
import { useUpsertIndicateurValeur } from '../../valeurs/use-upsert-indicateur-valeur';

export type SaveSousIndicateurValeur = (
  input: Readonly<{
    indicateurId: number;
    periode: IndicateurPeriode;
    field: IndicateurValeurField;
    value: number | null;
  }>
) => Promise<boolean>;

export const useSaveSousIndicateurValeur = (): SaveSousIndicateurValeur => {
  const collectiviteId = useCollectiviteId();
  const { mutateAsync: upsertValeur } = useUpsertIndicateurValeur({
    disableCreateToast: true,
  });

  return useCallback(
    async ({ indicateurId, periode, field, value }) => {
      try {
        await upsertValeur({
          collectiviteId,
          indicateurId,
          dateValeur: periode.dateDebut,
          periodicite: periode.periodicite,
          ...(field === 'resultat' ? { resultat: value } : { objectif: value }),
        });
        return true;
      } catch {
        return false;
      }
    },
    [collectiviteId, upsertValeur]
  );
};
