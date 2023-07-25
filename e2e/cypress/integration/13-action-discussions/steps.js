import {When} from '@badeball/cypress-cucumber-preprocessor';

import {LocalSelectors} from './selectors';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap(LocalSelectors).as('LocalSelectors', {type: 'static'});
});

// Génériques
const getFirstDiscussion = () =>
  cy.get('[data-test=ActionDiscussionsFeed]').first();

When(/le commentaire "([^"]+)" n'est plus visible/, value => {
  getFirstDiscussion().contains(value).should('not.exist');
});

When(/le commentaire "([^"]+)" est visible/, value => {
  getFirstDiscussion().scrollIntoView().contains(value).should('be.visible');
});

// Scénario: Consulter les discussions d'une action
When("je clique sur l'icône commentaires", () => {
  cy.get('[data-test=ActionDiscussionsButton]').click();
});

When('le panel-action-discussions est visible', () => {
  cy.get('[data-test=ActionDiscussionsPanel]').should('be.visible');
});

When('il affiche les discussions ouvertes', () => {
  cy.get('[data-test=ActionDiscussionsChangeVue]').contains('Ouverts');
});

// Scénario: Créer une discussion
When(/je saisis "([^"]+)" dans le champs nouvelle discussion/, value => {
  cy.get(`[data-test=ActionDiscussionsNouvelleDiscussion] textarea`).type(
    value
  );
});

When('je clique sur "publier" une nouvelle discussion', () => {
  cy.get('[data-test=ActionDiscussionsNouvelleDiscussion] button').click();
});

// Scénario: Répondre à un commentaire
When(/je saisis "([^"]+)" dans le champ répondre d'une discussion/, value => {
  getFirstDiscussion().find('textarea').first().type(value);
});

When('je clique sur "publier" une nouvelle réponse', () => {
  getFirstDiscussion().contains('Publier').click();
});

// Visualiser les réponses à un commentaire
When(/un bouton contenant "([^"]+)" est visible/, value => {
  getFirstDiscussion().contains(value);
});

When(/je clique sur le bouton "([^"]+)" de la 1ère discussion/, value => {
  getFirstDiscussion().contains(value).click();
});

// Scénario: Fermer et reouvrir une discussion
// When('je clique sur "Fermer" dans une discussion', () => {
//   getFirstDiscussion().contains('Fermer').click();
// });

When(/je clique sur "([^"]+)" dans une discussion/, value => {
  getFirstDiscussion().contains(value).click();
});

When('je change la vue du feed à "Fermés"', () => {
  cy.get('[data-test=ActionDiscussionsChangeVue]').contains('Ouverts').click();
  cy.root()
    .get(`[data-test="ActionDiscussionsChangeVueMenu"]`)
    .contains('Fermés')
    .click();
  cy.wait(100);
});

When('je change la vue du feed à "Ouverts"', () => {
  cy.get('[data-test=ActionDiscussionsChangeVue]').contains('Fermés').click();
  cy.root()
    .get(`[data-test="ActionDiscussionsChangeVueMenu"]`)
    .contains('Ouverts')
    .click();
});

// Scénario: Supprimer un commentaire
When(
  /je clique sur "([^"]+)" du commentaire "([^"]+)"/,
  (button, commentaire) => {
    getFirstDiscussion()
      .find('[data-test=ActionDiscussionCommentaireMenuButton]')
      .last()
      .click();
    cy.root()
      .get(`[data-test="ActionDiscussionCommentaireMenu"]`)
      .contains(button)
      .click();
    cy.wait(100);
  }
);
