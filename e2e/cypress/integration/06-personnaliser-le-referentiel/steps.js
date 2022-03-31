/// <reference types="Cypress" />

import { LocalSelectors } from './selectors';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap(LocalSelectors).as('LocalSelectors');
});

Given(
  /la liste des questions\/réponses contient les entrées suivantes/,
  (dataTable) => {
    // sélectionne le dialogue
    cy.get(
      LocalSelectors['dialogue Personnaliser le potentiel'].selector
    ).within(() => {
      // pour chaque question
      cy.wrap(dataTable.rows()).each(([question, type, reponse], index) => {
        cy.get(
          `[data-test=PersoPotentielQR] .fr-fieldset:nth(${index})`
        ).within(() => {
          // vérifie le libellé
          cy.get('.fr-fieldset__legend').should('contain.text', question);
          // et la réponse
          switch (type) {
            case 'proportion':
              cy.get('input[name=proportion]').should(
                'have.value',
                reponse || ''
              );
          }
        });
      });
    });
  }
);

Given(
  /je saisi une proportion de (\d+) pour la question (\d+)/,
  (reponse, numQuestion) => {
    cy.get(
      `${
        LocalSelectors['dialogue Personnaliser le potentiel'].selector
      } .fr-fieldset:nth(${numQuestion - 1})`
    ).within(() => {
      cy.get('input[name=proportion]').clear().type(reponse);
    });
  }
);
