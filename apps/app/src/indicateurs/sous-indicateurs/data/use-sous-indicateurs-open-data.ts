import { useQueries } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  COLLECTIVITE_SOURCE_ID,
  SOURCES_TRAJECTOIRE,
} from '@tet/domain/indicateurs';
import { useMemo } from 'react';
import { useListIndicateurValeurs } from '../../valeurs/use-list-indicateur-valeurs';
import {
  toOpenDataByIndicateurId,
  type SousIndicateurMoyenne,
  type SousIndicateurOpenData,
} from '../sous-indicateurs-open-data.rules';

const EXCLUDED_SOURCE_IDS: readonly string[] = [
  COLLECTIVITE_SOURCE_ID,
  ...SOURCES_TRAJECTOIRE,
];

const toMoyennes = (
  results: readonly Readonly<{ data: SousIndicateurMoyenne | undefined }>[]
): SousIndicateurMoyenne[] =>
  results.flatMap(({ data }) => (data ? [data] : []));

export const useSousIndicateursOpenData = (
  indicateurIds: readonly number[]
): ReadonlyMap<number, SousIndicateurOpenData> => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const valeursQuery = useListIndicateurValeurs(
    {
      indicateurIds: [...indicateurIds],
      excludedSources: [...EXCLUDED_SOURCE_IDS],
    },
    { enabled: indicateurIds.length > 0, keepPreviousData: true }
  );
  const moyennes = useQueries({
    queries: indicateurIds.map((indicateurId) =>
      trpc.indicateurs.valeurs.average.queryOptions({
        collectiviteId,
        indicateurId,
      })
    ),
    combine: toMoyennes,
  });
  const indicateurs = valeursQuery.data?.indicateurs;

  return useMemo(
    () =>
      toOpenDataByIndicateurId({
        indicateurs: indicateurs ?? [],
        moyennes,
        excludedSourceIds: EXCLUDED_SOURCE_IDS,
      }),
    [indicateurs, moyennes]
  );
};
