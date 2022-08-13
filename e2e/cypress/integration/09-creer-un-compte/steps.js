/// <reference types="Cypress" />

import { LocalSelectors } from './selectors';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap(LocalSelectors).as('LocalSelectors');
});

Given(/le bouton compte contient le texte "([^"]+)"/, (message) => {
  cy.get('[data-test="connectedMenu"] button').should('contain', message);
});

