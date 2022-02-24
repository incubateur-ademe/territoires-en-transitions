import {useHistory} from 'react-router-dom';
import {authBloc} from 'core-logic/observables/authBloc';

/**
 * Expose un objet window.e2e lorsque l'appli fonctionne dans Cypress
 */
export const E2E = () => {
  if ('Cypress' in window) {
    // expose l'objet history ainsi que le client supabase à l'env. E2E
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).e2e = {history: useHistory(), authBloc};
  }
  return null;
};
