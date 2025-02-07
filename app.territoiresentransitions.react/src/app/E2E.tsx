import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useUser } from '@/app/users/user-provider';
import { useHistory } from 'react-router-dom';

declare global {
  interface Window {
    e2e: {
      history: ReturnType<typeof useHistory>;
      user: ReturnType<typeof useUser>;
      supabaseClient: typeof supabaseClient;
    };
  }
}

/**
 * Expose un objet window.e2e lorsque l'appli fonctionne dans Cypress
 */
export const E2E = () => {
  const user = useUser();
  const history = useHistory();

  if (typeof window !== 'undefined' && 'Cypress' in window) {
    // expose l'objet history ainsi que le client supabase à l'env. E2E
    window.e2e = { history, user, supabaseClient };
  }
  return null;
};
