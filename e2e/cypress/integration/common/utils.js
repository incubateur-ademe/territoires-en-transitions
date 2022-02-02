/// <reference types="Cypress" />
import { Selectors } from './selectors';

defineStep("j'ouvre le site", () => cy.visit('/'));

// Met en pause le déroulement d'un scénario.
// Associé avec la directive @focus cela permet de debugger facilement
// les tests.
defineStep('pause', () => cy.pause());

// utilitaire pour vérifier quelques attentes d'affichage génériques à partir d'une table de correspondances
const Expectations = {
  absent: 'not.exist',
  présent: 'exist',
  visible: 'be.visible',
  contient: 'contain.text',
  activé: 'be.enabled',
  activée: 'be.enabled',
  désactivé: 'be.disabled',
  désactivée: 'be.disabled',
  aucun: { cond: 'have.length', value: 0 },
  plusieurs: { cond: 'have.length.greaterThan', value: 0 },
};
export const checkExpectation = (selector, expectation, value) => {
  const c = Expectations[expectation];
  if (!c) return;
  cy.get(selector).should(c, value);
};

defineStep(/la page vérifie les conditions suivantes/, (dataTable) => {
  const rows = dataTable.rows();
  cy.wrap(rows).each(([elem, expectation, value]) => {
    checkExpectation(Selectors[elem].selector, expectation, value);
  });
});

defineStep(
  /je clique sur le bouton "([^"]*)" du "([^"]*)"/,
  (subElement, elem) => {
    const parent = Selectors[elem];
    cy.get(parent.selector).find(parent.children[subElement]).click();
  }
);

defineStep(
  /je remplis le "([^"]*)" avec les valeurs suivantes/,
  (elem, dataTable) => {
    const parent = Selectors[elem];
    cy.get(parent.selector).within(() => {
      const rows = dataTable.rows();
      cy.wrap(rows).each(([field, value]) => {
        cy.get(parent.children[field]).clear().type(value);
      });
    });
  }
);

const Requests = {
  'auth.resetPasswordForEmail': {
    ok: ['/auth/v*/recover', { statusCode: 200, body: {} }],
  },
};

defineStep(/l'appel à "([^"]*)" va répondre "([^"]*)"/, (name, reply) => {
  const r = Requests[name][reply];
  cy.intercept(...r).as(name);
});
