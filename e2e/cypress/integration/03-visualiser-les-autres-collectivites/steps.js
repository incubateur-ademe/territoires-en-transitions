import {defineStep} from '@badeball/cypress-cucumber-preprocessor';

defineStep(/la page contient au moins (\d+) collectivités?/, count => {
  cy.get('[data-test=CollectiviteCarte]').should('have.length.gt', count);
});
