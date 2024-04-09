import {When} from '@badeball/cypress-cucumber-preprocessor';
import {LocalSelectors} from './selectors';
import {LocalMocks} from './mocks';

// enregistre les définitions locales
beforeEach(() => {
  cy.wrap(LocalSelectors).as('LocalSelectors', {type: 'static'});
  cy.wrap(LocalMocks).as('LocalMocks', {type: 'static'});
});

When('je vais vérifier les données envoyées à la chatbox', () => {
  // attend que le client crisp soit chargé
  cy.window({log: false})
    .its('$crisp')
    // et enregistre un espion pour sa méthode `push`
    .then($crisp => cy.spy($crisp, 'push').as('crisp.push'));
});

When('les données suivantes ont été envoyées à la chatbox :', dataTable => {
  const {nom, prenom, email} = dataTable.rowsHash();
  // vérifie que l'identité de l'utilisateur est associée à la session crisp
  cy.get('@crisp.push').should('be.calledWith', [
    'set',
    'user:nickname',
    [`${prenom} ${nom}`],
  ]);
  cy.get('@crisp.push').should('be.calledWith', ['set', 'user:email', [email]]);
});
