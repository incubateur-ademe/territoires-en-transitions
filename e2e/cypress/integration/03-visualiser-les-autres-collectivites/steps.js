import {When} from '@badeball/cypress-cucumber-preprocessor';

When(/la page contient au moins (\d+) collectivités?/, count => {
  cy.get('[data-test=CollectiviteCarte]').should('have.length.gt', count);
});
