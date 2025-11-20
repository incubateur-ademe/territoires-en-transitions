import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';
import { ReferentielId } from '@tet/domain/referentiels';

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
