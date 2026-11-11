import { PALETTE } from '@/app/ui/charts/echarts';
import { useQuery } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';
import { SOURCES_TRAJECTOIRE } from '@tet/domain/indicateurs';
import { useCallback, useMemo } from 'react';
import { LAYERS as LAYERS_TRAJECTOIRE } from '../../Trajectoire/graphes/layer-parameters';
import { LAYERS as INDICATEUR_LAYERS } from '../chart/layer-parameters';
import { SourceType } from '../types';

const LAYERS = {
  ...LAYERS_TRAJECTOIRE,
  ...INDICATEUR_LAYERS,
};

/** Charge la liste des sources de données indicateurs */
const useIndicateurSources = () => {
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
const useColorBySourceId = () => {
  const { data: sources } = useIndicateurSources();
  return useMemo(() => {
    const colorBySourceId: Record<string, string> = {};
    let paletteIndex = 0;
    for (const source of sources ?? []) {
      // Les sources de trajectoire ont leur couleur dédiée et ne consomment
      // pas d'index.
      if (isSourceTrajectoire(source.id)) continue;
      colorBySourceId[source.id] = PALETTE[paletteIndex % PALETTE.length];
      paletteIndex += 1;
    }
    return colorBySourceId;
  }, [sources]);
};

/** Source de trajectoire (SNBC 2 ou SNBC 3). */
export const isSourceTrajectoire = (sourceId: string) =>
  (SOURCES_TRAJECTOIRE as readonly string[]).includes(sourceId);

/**
 * Fourni une fonction permettant d'obtenir la couleur associée à une source de
 * données.
 *
 * `avecSnbc3` : la source `snbc3` est servie pour l'indicateur. Elle prend la
 * couleur de la trajectoire et la SNBC 2 passe à une couleur plus claire ;
 * sinon la SNBC 2 garde la couleur de la trajectoire.
 */
export const useGetColorBySourceId = ({
  avecSnbc3 = false,
}: { avecSnbc3?: boolean } = {}) => {
  const colorBySourceId = useColorBySourceId();
  return useCallback(
    (sourceId: string | null, type: SourceType) => {
      if (!sourceId || sourceId === 'collectivite') {
        return LAYERS[`${type}s`].color;
      }
      if (sourceId === 'snbc3') return LAYERS.trajectoire.color;
      if (sourceId === 'snbc') {
        return avecSnbc3
          ? LAYERS.trajectoireSnbc2.color
          : LAYERS.trajectoire.color;
      }
      if (sourceId === 'moyenne') return LAYERS.moyenne.color;
      return colorBySourceId[sourceId];
    },
    [avecSnbc3, colorBySourceId]
  );
};

export type GetColorBySourceId = ReturnType<typeof useGetColorBySourceId>;
