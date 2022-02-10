/// <reference types="Cypress" />

/**
 * Définitions de "steps" communes à tous les tests
 */

import { Selectors } from './selectors';
import { Expectations } from './expectations';

defineStep("j'ouvre le site", () => cy.visit('/'));

// Met en pause le déroulement d'un scénario.
// Associé avec le tag @focus cela permet de debugger facilement les tests.
defineStep('pause', () => cy.pause());

// utilitaire pour vérifier quelques attentes d'affichage génériques à partir d'une table de correspondances
export const checkExpectation = (selector, expectation, value) => {
  const c = Expectations[expectation];
  if (!c) return;
  if (typeof c === 'object' && c.cond) {
    cy.get(selector).should(c.cond, value || c.value);
  } else if (typeof c === 'function') {
    c(selector, value);
  } else {
    cy.get(selector).should(c, value);
  }
};

// renvoi le sélecteur local (ou à défaut le sélecteur global) correspondant à
// un nom d'élément dans la page
const resolveSelector = (context, elem) => {
  const s = context.LocalSelectors?.[elem] || Selectors[elem];
  assert(s, 'sélecteur non trouvé');
  return s;
};

// on utilise "function" (plutôt qu'une arrow function) pour que "this" donne
// accès au contexte de manière synchrone
// Ref: https://docs.cypress.io/guides/core-concepts/variables-and-aliases#Sharing-Context
defineStep(/la page vérifie les conditions suivantes/, function (dataTable) {
  const rows = dataTable.rows();
  cy.wrap(rows).each(([elem, expectation, value]) => {
    checkExpectation(resolveSelector(this, elem).selector, expectation, value);
  });
});

defineStep(
  /je clique sur le bouton "([^"]*)" du "([^"]*)"/,
  function (subElement, elem) {
    const parent = resolveSelector(this, elem);
    cy.get(parent.selector).find(parent.children[subElement]).click();
  }
);

defineStep(
  /je remplis le "([^"]*)" avec les valeurs suivantes/,
  function (elem, dataTable) {
    const parent = resolveSelector(this, elem);
    cy.get(parent.selector).within(() => {
      const rows = dataTable.rows();
      cy.wrap(rows).each(([field, value]) => {
        cy.get(parent.children[field]).clear().type(value);
      });
    });
  }
);

defineStep(/l'appel à "([^"]*)" va répondre "([^"]*)"/, function (name, reply) {
  const r = this.LocalMocks?.[name]?.[reply];
  assert(r, 'mock non trouvé');
  cy.intercept(...r).as(name);
});
