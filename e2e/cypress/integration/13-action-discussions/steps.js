import {defineStep} from '@badeball/cypress-cucumber-preprocessor';

import {LocalSelectors} from './selectors';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap(LocalSelectors).as('LocalSelectors', {type: 'static'});
});

// Génériques
const getFirstDiscussion = () =>
  cy.get('[data-test=ActionDiscussionsFeed]').first();

defineStep(/le commentaire "([^"]+)" n'est plus visible/, value => {
  getFirstDiscussion().contains(value).should('not.exist');
});

defineStep(/le commentaire "([^"]+)" est visible/, value => {
  getFirstDiscussion().contains(value).should('be.visible');
});

// Scénario: Consulter les discussions d'une action
defineStep("je clique sur l'icône commentaires", () => {
  cy.get('[data-test=ActionDiscussionsButton]').click();
});

defineStep('le panel-action-discussions est visible', () => {
  cy.get('[data-test=ActionDiscussionsPanel]').should('be.visible');
});

defineStep('il affiche les discussions ouvertes', () => {
  cy.get('[data-test=ActionDiscussionsChangeVue]').contains('Ouverts');
});

// Scénario: Créer une discussion
defineStep(/je saisis "([^"]+)" dans le champs nouvelle discussion/, value => {
  cy.get(`[data-test=ActionDiscussionsNouvelleDiscussion] textarea`).type(
    value
  );
});

defineStep('je clique sur "publier" une nouvelle discussion', () => {
  cy.get('[data-test=ActionDiscussionsNouvelleDiscussion] button').click();
});

// Scénario: Répondre à un commentaire
defineStep(
  /je saisis "([^"]+)" dans le champ répondre d'une discussion/,
  value => {
    getFirstDiscussion().find('textarea').first().type(value);
  }
);

defineStep('je clique sur "publier" une nouvelle réponse', () => {
  getFirstDiscussion().contains('Publier').click();
});

// Visualiser les réponses à un commentaire
defineStep(/un bouton contenant "([^"]+)" est visible/, value => {
  getFirstDiscussion().contains(value);
});

defineStep(/je clique sur le bouton "([^"]+)" de la 1ère discussion/, value => {
  getFirstDiscussion().contains(value).click();
});

// Scénario: Fermer et reouvrir une discussion
// defineStep('je clique sur "Fermer" dans une discussion', () => {
//   getFirstDiscussion().contains('Fermer').click();
// });

defineStep(/je clique sur "([^"]+)" dans une discussion/, value => {
  getFirstDiscussion().contains(value).click();
});

defineStep('je change la vue du feed à "Fermés"', () => {
  cy.get('[data-test=ActionDiscussionsChangeVue]').contains('Ouverts').click();
  cy.root()
    .get(`[data-test="ActionDiscussionsChangeVueMenu"]`)
    .contains('Fermés')
    .click();
  cy.wait(100);
});

defineStep('je change la vue du feed à "Ouverts"', () => {
  cy.get('[data-test=ActionDiscussionsChangeVue]').contains('Fermés').click();
  cy.root()
    .get(`[data-test="ActionDiscussionsChangeVueMenu"]`)
    .contains('Ouverts')
    .click();
});

// Scénario: Supprimer un commentaire
defineStep(
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
