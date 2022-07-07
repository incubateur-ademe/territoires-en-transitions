import {useHistory} from 'react-router-dom';
import {supabaseClient} from 'core-logic/api/supabase';
import {useAuth} from 'core-logic/api/auth/AuthProvider';

/**
 * Expose un objet window.e2e lorsque l'appli fonctionne dans Cypress
 */
export const E2E = () => {
  const auth = useAuth();

  if ('Cypress' in window) {
    // expose l'objet history ainsi que le client supabase à l'env. E2E
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).e2e = {history: useHistory(), auth, supabaseClient};
  }
  return null;
};
