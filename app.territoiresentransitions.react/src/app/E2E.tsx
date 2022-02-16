import {useHistory} from 'react-router-dom';

/**
 * Expose un objet window.e2e lorsque l'appli fonctionne dans Cypress
 */
export const E2E = () => {
  if ('Cypress' in window) {
    // expose l'objet history à l'env. E2E
    const history = useHistory();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).e2e = {history};
  }
  return null;
};
