/// <reference types="Cypress" />

Given(/la page contient (\d+) collectivités?/, (count) => {
  cy.get('[data-test=SimpleCollectiviteCard]').should('have.length', count);
});
