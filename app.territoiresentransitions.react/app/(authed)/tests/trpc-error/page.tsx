'use client';

import { trpc } from '@/api/utils/trpc/client';
import { useEffect } from 'react';

export default function Page() {

  const throwResult = trpc.throwError.useQuery({
  });

  useEffect(() => {

    if (throwResult.error) {
      throw throwResult.error;
    }

  }, [throwResult.error]);

  return <></>;
}
