'use client';

import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';

export type OrganismeAvecReferents =
  RouterOutput['demarches']['pcaet']['referents']['listOrganismes'][number];

export const useListReferentsOrganismes = ({
  collectiviteId,
  regionCode,
}: {
  collectiviteId: number;
  regionCode: string | null;
}) => {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.demarches.pcaet.referents.listOrganismes.queryOptions(
      { collectiviteId, regionCode: regionCode ?? '' },
      { enabled: !!regionCode }
    )
  );

  return { organismes: data ?? [], isLoading };
};
