import { DBClient } from '@/api';
import { useUser } from '@/api/users/user-provider';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useHistory } from 'react-router-dom';

declare global {
  interface Window {
    e2e: {
      history: ReturnType<typeof useHistory>;
      user: ReturnType<typeof useUser>;
      supabase: DBClient;
    };
  }
}

/**
 * Expose un objet window.e2e lorsque l'appli fonctionne dans Cypress
 */
export const E2E = () => {
  const user = useUser();
  const history = useHistory();
  const supabase = useSupabase();

  if (typeof window !== 'undefined' && 'Cypress' in window) {
    // expose l'objet history ainsi que le client supabase à l'env. E2E
    window.e2e = { history, user, supabase };
  }
  return null;
};
