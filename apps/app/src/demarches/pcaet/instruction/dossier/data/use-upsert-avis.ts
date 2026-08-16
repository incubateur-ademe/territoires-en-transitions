'use client';

import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useUpsertAvis = () => {
  const trpc = useTRPC();

  return useMutation(
    trpc.demarches.pcaet.upsertAvis.mutationOptions({
      meta: { disableToast: true },
    })
  );
};
