import { RouterOutput, useTRPC } from '@/api';
import { ReferentielId } from '@/domain/referentiels';
import { useQuery } from '@tanstack/react-query';

export type ReferentielDefinition =
  RouterOutput['referentiels']['definitions']['get'];

export const useGetReferentielDefinition = ({
  referentielId,
  options,
}: {
  referentielId: ReferentielId;
  options?: { enabled?: boolean };
}) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.referentiels.definitions.get.queryOptions({ referentielId }, options)
  );
};
