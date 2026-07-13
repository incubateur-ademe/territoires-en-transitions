'use client';

import { signOutUser } from '@tet/api/utils/supabase/sign-out-user.server';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';

export function useLogout() {
  const router = useRouter();

  return async (event?: MouseEvent<HTMLAnchorElement>) => {
    event?.preventDefault();
    await signOutUser();
    router.push('/');
    router.refresh();
  };
}
