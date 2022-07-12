import { LocalSelectors } from './selectors';
import { LocalMocks } from './mocks';

// enregistre les définitions locales
beforeEach(() => {
  cy.wrap(LocalSelectors).as('LocalSelectors');
  cy.wrap(LocalMocks).as('LocalMocks');
});

Given(
  "j'ouvre le site depuis un lien de réinitialisation du mot de passe",
  () => {
    // génère le lien tel qui sera généré par le back et envoyé par mail (il est
    // difficile de tester la réception de mail directement)
    cy.task('supabase_generateLink', {
      type: 'recovery',
      email: 'yolo@dodo.com',
    }).then((res) => {
      // vérifie le lien
      const action_link = res?.data?.action_link;
      assert(action_link, 'lien de réinit de mdp non trouvé');

      // extrait le token
      const token = action_link.match(/token=([A-Z0-9\-\_]+)/i)[1];
      assert(token, 'token non trouvé');

      // crée un lien tel qui doit être reçu par email et visite cette page
      cy.visit(`/auth/recover_landing/${token}`);
    });
  }
);
