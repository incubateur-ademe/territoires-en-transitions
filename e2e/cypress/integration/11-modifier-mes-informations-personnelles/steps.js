import {defineStep} from '@badeball/cypress-cucumber-preprocessor';

import {LocalSelectors} from './selectors';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap(LocalSelectors).as('LocalSelectors', {type: 'static'});
});

defineStep('un formulaire de modification de compte est affiché', () => {
  cy.get(
    LocalSelectors['formulaire de modification de compte'].selector
  ).should('be.visible');
});

defineStep(/je modifie le champ "([^"]+)" en "([^"]+)"/, (champ, value) => {
  cy.get(`[data-test="${champ}"]`)
    .type('{selectall}{backspace}' + value)
    .blur();
});

defineStep(/le champ "([^"]+)" doit contenir "([^"]+)"/, (champ, value) => {
  cy.get(`[data-test="${champ}"]`).should('have.value', value);
});

defineStep("la modale de modification d'email est affichée", () => {
  cy.get(LocalSelectors["modale de modification d'email"].selector).should(
    'be.visible'
  );
});

defineStep(/je vide la boite de reception de "([^"]+)"/, email => {
  cy.origin(`http://localhost:54324/`, {args: {email}}, ({email}) => {
    cy.visit('/');
    cy.get(`[ng-click="deleteAll()"]`).click();
    cy.get(`[ng-click="deleteAllConfirm()"]`).click();
  });
  cy.visit('/');
});

defineStep(
  "je clique sur le bouton confirmer de la modale de modification d'email",
  () => {
    cy.get(LocalSelectors["modale de modification d'email"].selector)
      .get(`[aria-label="Confirmer"]`)
      .click();
  }
);

defineStep(
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
