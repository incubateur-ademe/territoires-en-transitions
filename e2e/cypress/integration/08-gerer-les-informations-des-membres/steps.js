/// <reference types="Cypress" />

import {LocalSelectors} from './selectors';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap(LocalSelectors).as('LocalSelectors');
});

Given('le tableau des membres doit contenir les informations suivantes',
  (dataTable) => {
    cy.get(LocalSelectors['tableau des membres'].selector).within(
      () => {
        cy.get('[data-test=Loading]').should("be.visible");
        cy.get('[data-test=Loading]').should("not.exist");
        cy.wrap(dataTable.rows()).each(([nom, mail, telephone], index) => {
          cy.get(`tbody tr:nth(${index})`).within(() => {
            cy.get('td:first').should('contain.text', nom);
          });
        });
      }

    );
  });

