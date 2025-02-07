import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useAuth } from '@/app/core-logic/api/auth/AuthProvider';
import { useHistory } from 'react-router-dom';

declare global {
  interface Window {
    e2e: {
      history: ReturnType<typeof useHistory>;
      auth: ReturnType<typeof useAuth>;
      supabaseClient: typeof supabaseClient;
    };
  }
}

/**
 * Expose un objet window.e2e lorsque l'appli fonctionne dans Cypress
 */
export const E2E = () => {
  const auth = useAuth();
  const history = useHistory();

  if (typeof window !== 'undefined' && 'Cypress' in window) {
    // expose l'objet history ainsi que le client supabase à l'env. E2E
    window.e2e = { history, auth, supabaseClient };
  }
  return null;
};
