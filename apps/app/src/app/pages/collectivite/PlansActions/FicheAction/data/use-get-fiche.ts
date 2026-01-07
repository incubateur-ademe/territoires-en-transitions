import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';
import { FicheWithRelations } from '@tet/domain/plans';

export type Fiche = RouterOutput['plans']['fiches']['get'];

export function useGetFiche({
  id,
  initialData,
}: {
  id: number;
  initialData?: FicheWithRelations;
}) {
  const trpc = useTRPC();
  const { data, ...other } = useQuery(
    trpc.plans.fiches.get.queryOptions(
      {
        id,
      },
      {
        initialData,
      }
    )
  );
  return {
    data: data
      ? {
          ...data,
          axes: data.axes?.filter((axe) => axe.axeLevel === 1) || null,
        }
      : data,
    ...other,
  };
}
