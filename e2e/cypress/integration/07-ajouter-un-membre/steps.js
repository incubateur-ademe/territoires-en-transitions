/// <reference types="Cypress" />

import { LocalSelectors } from './selectors';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap(LocalSelectors).as('LocalSelectors');
});

Given("un formulaire d'invitation est affiché", () => {
  cy.get(LocalSelectors["formulaire d'invitation"].selector).should(
  'be.visible'
  );
});

Given("un message d'invitation est affiché", () => {
  cy.get(LocalSelectors["message d'invitation"].selector).should(
  'be.visible'
  );
});
Given(/je renseigne l'email "([^"]+)" de la personne à inviter en "([^"]+)"/, (email, acces) => {
  cy.get('input[name="email"]')
  .clear()
  .type(email)
  cy.get('select[name="acces"]')
  .select(acces)
});


Given(
  /le tableau des membres doit contenir l'utilisateur "([^"]+)"/,
  (mail) => {
    cy.get(LocalSelectors["tableau des membres"].selector).should(
      "contain",
      mail
    );
  }
);

// pour que le test sur le contenu du presse-papier fonctionne correctement
// on doit donner le focus au bouton et utiliser realClick au lien de click :(
// Ref: https://github.com/cypress-io/cypress/issues/18198#issuecomment-1003756021
Given('je clique sur le bouton "Copier le message"', () => {
  cy.get(LocalSelectors['Copier le message'].selector).focus().realClick();
});

Given('je clique sur le bouton "Copier le lien"', () => {
  cy.get(LocalSelectors['Copier le lien'].selector).focus().realClick();
});

Given(/le presse-papier contient "([^"]*)"/, (message) => {
  cy.task('getClipboard').should('contain', message);
});

Given('je visite le lien copié', () =>
  cy.task('getClipboard').then((val) => {
    cy.visit({
      url: val,
    });
  })
);

Given(
  /la page contient (?:les|la) collectivités? "([^"]*)"/,
  (collectiviteNames) => {
    const names = collectiviteNames.split(',').map((s) => s.trim());
    cy.get('[data-test=SimpleCollectiviteCard]').each(($el, index) =>
      cy.wrap($el).should('contain.text', names[index])
    );
  }
);

Given('la page ne contient aucune collectivité', () => {
  cy.get('[data-test=SimpleCollectiviteCard]').should('not.exist');
});
