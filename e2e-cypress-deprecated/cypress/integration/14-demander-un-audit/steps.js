import {When} from '@badeball/cypress-cucumber-preprocessor';

import {LocalSelectors} from './selectors';
import {LocalSelectors as PreuveSelectors} from '../04-associer-des-preuves-aux-actions/selectors';
import '../12-utiliser-la-bibliotheque/steps';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap({...PreuveSelectors, ...LocalSelectors}).as('LocalSelectors', {
    type: 'static',
  });
});

When(
  `la liste des documents de labellisation contient le titre {string} sans l'indication {string}`,
  checkDocLabellisation
);
When(
  `la liste des documents de labellisation contient le titre {string} avec l'indication {string}`,
  (titre, indication) => checkDocLabellisation(titre, indication, true)
);

function checkDocLabellisation(titre, indication, contient = false) {
  cy.get('[data-test=labellisation] h3')
    .should('contain.text', titre)
    .should(contient ? 'contain.text' : 'not.contain.text', indication);
}
