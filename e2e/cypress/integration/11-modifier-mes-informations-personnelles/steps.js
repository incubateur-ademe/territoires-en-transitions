/// <reference types="Cypress" />

import {LocalSelectors} from './selectors';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap(LocalSelectors).as('LocalSelectors');
});

Given('un formulaire de modification de compte est affiché', () => {
  cy.get(
    LocalSelectors['formulaire de modification de compte'].selector
  ).should('be.visible');
});

Given(/je modifie le champ "([^"]+)" en "([^"]+)"/, (champ, value) => {
  cy.get(`[data-test="${champ}"]`).clear().type(value).blur();
});

Given(/le champ "([^"]+)" doit contenir "([^"]+)"/, (champ, value) => {
  cy.get(`[data-test="${champ}"]`).should('have.value', value);
});

Given("la modale de modification d'email est affichée", () => {
  cy.get(LocalSelectors["modale de modification d'email"].selector).should(
    'be.visible'
  );
});

Given(/je vide la boite de reception de "([^"]+)"/, email => {
  cy.origin(`http://localhost:54324/`, {args: {email}}, ({email}) => {
    cy.visit(`/m/${email}`);
    cy.get(`.fa-trash`).click();
    cy.get(`.danger`).click();
  });
  cy.visit('/');
});

Given(
  "je clique sur le bouton confirmer de la modale de modification d'email",
  () => {
    cy.get(LocalSelectors["modale de modification d'email"].selector)
      .get(`[aria-label="Confirmer"]`)
      .click();
  }
);

Given(
  /la boite de reception de "([^"]+)" contient un mail intitulé "([^"]+)"/,
  (email, titre) => {
    cy.origin(
      `http://localhost:54324/`,
      {args: {email, titre}},
      ({email, titre}) => {
        cy.visit(`/m/${email}`);
        cy.get('.message-list').contains(titre);
      }
    );
  }
);
