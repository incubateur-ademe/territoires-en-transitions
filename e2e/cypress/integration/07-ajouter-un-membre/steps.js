/// <reference types="Cypress" />

import { LocalSelectors } from './selectors';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap(LocalSelectors).as('LocalSelectors');
});

Given("un lien d'invitation est affiché", () => {
  cy.wait(3000);
  cy.get(LocalSelectors["lien d'invitation"].selector).should(
    'contain.value',
    '/invitation/',
  );
});

Given('je clique sur le bouton "Copier"', () => {
  // pour que le test sur le contenu du presse-papier fonctionne correctement
  // on doit donner le focus au bouton et utiliser realClick au lien de click :(
  // Ref: https://github.com/cypress-io/cypress/issues/18198#issuecomment-1003756021
  cy.get(LocalSelectors['Copier'].selector).focus().realClick();
});

Given('le presse-papier contient le lien copié', () => {
  cy.get(LocalSelectors["lien d'invitation"].selector)
    .invoke('val')
    .then((val) => {
      cy.task('getClipboard').should('equal', val);
    });
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
