/// <reference types="Cypress" />

import {LocalSelectors} from './selectors';
import {LocalSelectors as PreuveSelectors} from '../04-associer-des-preuves-aux-actions/selectors';
import '../12-utiliser-la-bibliotheque/steps';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap({...PreuveSelectors, ...LocalSelectors}).as('LocalSelectors');
});
