'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useEffect } from 'react';

export default function Page() {
  const trpc = useTRPC();

  const throwResult = useQuery(trpc.throwError.queryOptions({}));

  useEffect(() => {
    if (throwResult.error) {
      throw throwResult.error;
    }
  }, [throwResult.error]);

  return <></>;
}
