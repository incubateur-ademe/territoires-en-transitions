/// <reference types="Cypress" />

import { LocalSelectors } from "./selectors";

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap(LocalSelectors).as("LocalSelectors");
});

Given("un formulaire de modification de compte est affiché", () => {
  cy.get(
    LocalSelectors["formulaire de modification de compte"].selector
  ).should("be.visible");
});

Given(/je modifie le champ "([^"]+)" en "([^"]+)"/, (champ, value) => {
  cy.get(`[data-test="${champ}"]`).clear().type(value).blur();
});

Given(/le champ "([^"]+)" doit contenir "([^"]+)"/, (champ, value) => {
  cy.get(`[data-test="${champ}"]`).should("have.value", value);
});

Given("la modale de modification d'email est affichée", () => {
  cy.get(LocalSelectors["modale de modification d'email"].selector).should(
    "be.visible"
  );
});

Given (/je vide ma boite de reception/, (email) => {
  cy.origin(`http://localhost:8025/`, { args: { email } }, ({ email }) => {
    cy.visit("/");
    cy.get(`[ng-click="deleteAll()"]`).click();
    cy.get(`[ng-click="deleteAllConfirm()"]`).click();
  })
  cy.visit("/");
});

Given("je clique sur le bouton confirmer de la modale de modification d'email", () => {
  cy.get(LocalSelectors["modale de modification d'email"].selector).get(`[aria-label="Confirmer"]`).click();
});

Given (/ma boite de reception contient un mail adressé à "([^"]+)"/, (email) => {
  cy.origin(`http://localhost:8025/`, { args: { email } }, ({ email }) => {
    cy.visit("/");
    cy.get(".msglist-message").contains(email);
  })
});
