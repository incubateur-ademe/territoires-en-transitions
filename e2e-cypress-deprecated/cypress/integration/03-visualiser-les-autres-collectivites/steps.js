import { When } from '@badeball/cypress-cucumber-preprocessor';

When(/la page contient au moins (\d+) collectivités?/, (count) => {
  cy.get('[data-test=CollectiviteCarte]').should('have.length.gt', count);
});

When(/la page contient au moins (\d+) plans d'action?/, (count) => {
  cy.get('[data-test=PlanCarte]').should('have.length.gte', count);
});

When(/le toggle "([^"]+)" est désactivé/, (bouton) => {
  cy.get(`[data-test=${bouton}]`).should('be.disabled');
});

When(/je clique sur le toggle "([^"]+)"/, (toggle) => {
  cy.get(`[data-test=${toggle}]`).click();
});

When(/je recherche "([^"]+)" dans les collectivités/, (recherche) => {
  cy.get('[data-test=CollectiviteSearchInput]').clear();
  cy.get('[data-test=CollectiviteSearchInput]').type(recherche);
});

When(/la page contient 1 collectivité/, () => {
  cy.get('[data-test=CollectiviteCarte]').should('have.length', 1);
});

When(/la carte collectivite ne devrait pas être cliquable/, () => {
  cy.get('[data-test=CollectiviteCarte]').should(
    'have.css',
    'pointer-events',
    'none'
  );
});

When(/je clique sur la carte de la collectivité/, () => {
  cy.get('[data-test=CollectiviteCarte]').first().click();
});

When(/je clique sur la carte du plan/, () => {
  cy.get('[data-test=PlanCarte]').first().click();
});
