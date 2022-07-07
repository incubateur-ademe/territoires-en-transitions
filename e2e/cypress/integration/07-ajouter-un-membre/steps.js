/// <reference types="Cypress" />

import { LocalSelectors } from './selectors';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap(LocalSelectors).as('LocalSelectors');
});

Given("un lien d'invitation est affiché", () => {
  cy.get(LocalSelectors["lien d'invitation"].selector).should(
    'contain.value',
    '/invitation/'
  );
});

Given('je clique sur le bouton "Copier"', () => {
  cy.get(LocalSelectors['Copier'].selector).click();
});

Given('le presse-papier contient le lien copié', () => {
  cy.get(LocalSelectors["lien d'invitation"].selector)
    .invoke('val')
    .then((val) => {
      cy.window()
        .its('navigator.clipboard')
        .invoke('readText')
        .should('equal', val);
    });
});

const invitationId = '7791dd09-806d-404c-8a65-163a24150b33';
Given("j'ouvre un lien d'invitation", () =>
  cy.visit(`/invitation/${invitationId}`)
);
