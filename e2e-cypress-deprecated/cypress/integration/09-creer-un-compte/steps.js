import {When} from '@badeball/cypress-cucumber-preprocessor';

import {LocalSelectors} from './selectors';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap(LocalSelectors).as('LocalSelectors', {type: 'static'});
});

When(/le bouton compte contient le texte "([^"]+)"/, message => {
  cy.get('[data-test="nav-user"] button').should('contain', message);
});
