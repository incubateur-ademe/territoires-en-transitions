import { trpc } from '@/api/utils/trpc/client';
import { LAYERS, PALETTE } from '@/app/ui/charts/echarts';
import { SourceType } from '../types';

/** Charge la liste des sources de données indicateurs */
export const useIndicateurSources = () =>
  trpc.indicateurs.sources.list.useQuery();

/** Attribut une couleur à chaque source de données  */
export const useColorBySourceId = () => {
  const { data: sources } = useIndicateurSources();
  const colorBySourceId: Record<string, string> = {};
  (sources ?? [])
    // on enlève la source snbc pour que l'index dans la palette ne soit pas utilisé
    // la couleur pour cette source étant attribuée dans `useGetColorBySourceId`
    .filter((s) => s.id !== 'snbc')
    .forEach((source, index) => {
      colorBySourceId[source.id] = PALETTE[index % PALETTE.length];
    });
  return colorBySourceId;
};

/** Fourni une fonction permettant d'obtenir la couleur associée à une source de données */
export const useGetColorBySourceId = () => {
  const colorBySourceId = useColorBySourceId();
  return (sourceId: string | null, type: SourceType) => {
    if (!sourceId || sourceId === 'collectivite')
      return LAYERS[`${type}s`].color;
    if (sourceId === 'snbc') return LAYERS.trajectoire.color;
    return colorBySourceId[sourceId];
  };
};

export type GetColorBySourceId = ReturnType<typeof useGetColorBySourceId>;
