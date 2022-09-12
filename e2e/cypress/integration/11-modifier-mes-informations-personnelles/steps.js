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
