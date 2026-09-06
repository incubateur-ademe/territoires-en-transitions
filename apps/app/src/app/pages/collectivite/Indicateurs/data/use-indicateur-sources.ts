import { PALETTE } from '@/app/ui/charts/echarts';
import { useQuery } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';
import { useCallback, useMemo } from 'react';
import { LAYERS as LAYERS_TRAJECTOIRE } from '../../Trajectoire/graphes/layer-parameters';
import { LAYERS as INDICATEUR_LAYERS } from '../chart/layer-parameters';
import { SourceType } from '../types';

const LAYERS = {
  ...LAYERS_TRAJECTOIRE,
  ...INDICATEUR_LAYERS,
};

/** Charge la liste des sources de données indicateurs */
export const useIndicateurSources = () => {
  const trpc = useTRPC();
  return useQuery(trpc.indicateurs.sources.list.queryOptions());
};

/** Charge la liste des sources de données disponible pour un indicateur */
export type GetAvailableSourcesInput =
  RouterInput['indicateurs']['sources']['available'];
export const useIndicateurAvailableSources = (
  input: GetAvailableSourcesInput
) => {
  const trpc = useTRPC();
  return useQuery(trpc.indicateurs.sources.available.queryOptions(input));
};

/** Attribut une couleur à chaque source de données  */
export const useColorBySourceId = () => {
  const { data: sources } = useIndicateurSources();
  return useMemo(() => {
    const colorBySourceId: Record<string, string> = {};
    let paletteIndex = 0;
    for (const source of sources ?? []) {
      // La source SNBC a sa couleur dédiée et ne consomme pas d'index.
      if (source.id === 'snbc') continue;
      colorBySourceId[source.id] = PALETTE[paletteIndex % PALETTE.length];
      paletteIndex += 1;
    }
    return colorBySourceId;
  }, [sources]);
};

/** Fourni une fonction permettant d'obtenir la couleur associée à une source de données */
export const useGetColorBySourceId = () => {
  const colorBySourceId = useColorBySourceId();
  return useCallback(
    (sourceId: string | null, type: SourceType) => {
      if (!sourceId || sourceId === 'collectivite') {
        return LAYERS[`${type}s`].color;
      }
      if (sourceId === 'snbc') return LAYERS.trajectoire.color;
      if (sourceId === 'moyenne') return LAYERS.moyenne.color;
      return colorBySourceId[sourceId];
    },
    [colorBySourceId]
  );
};

export type GetColorBySourceId = ReturnType<typeof useGetColorBySourceId>;
