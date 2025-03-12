'use client';

import { trpc } from '@/api/utils/trpc/client';
import { useEffect } from 'react';

export default function Page() {

  const throwResult = trpc.error.throw.useQuery({
  });

  useEffect(() => {

    if (throwResult.error) {
      throw throwResult.error;
    }

  }, [throwResult.error]);

  return <></>;
}
