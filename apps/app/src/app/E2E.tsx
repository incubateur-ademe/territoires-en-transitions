'use client';

import { DBClient } from '@/api';
import { useSupabase } from '@/api';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    e2e: {
      router: ReturnType<typeof useRouter>;
      supabase: DBClient;
    };
  }
}

/**
 * Expose un objet window.e2e lorsque l'appli fonctionne dans Cypress
 */
export const E2EProvider = () => {
  const router = useRouter();
  const supabase = useSupabase();

  if (typeof window !== 'undefined' && 'Cypress' in window) {
    // expose ces objets à l'env. E2E
    window.e2e = { router, supabase };
  }

  return null;
};
