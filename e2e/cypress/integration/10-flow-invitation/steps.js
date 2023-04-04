import {defineStep} from '@badeball/cypress-cucumber-preprocessor';

import {LocalSelectors} from './selectors';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap(LocalSelectors).as('LocalSelectors', {type: 'static'});
});

defineStep("un formulaire d'invitation est affiché", () => {
  cy.get(LocalSelectors["formulaire d'invitation"].selector).should(
    'be.visible'
  );
});

defineStep("un message d'invitation est affiché", () => {
  cy.get(LocalSelectors["message d'invitation"].selector).should('be.visible');
});
defineStep(
  /je renseigne l'email "([^"]+)" de la personne à inviter en "([^"]+)"/,
  (email, acces) => {
    cy.get('input[name="email"]').type('{selectall}{backspace}' + email);
    cy.get('select[name="acces"]').select(acces);
  }
);

defineStep(
  /le tableau des membres doit contenir l'utilisateur "([^"]+)"/,
  mail => {
    cy.get(LocalSelectors['tableau des membres'].selector).should(
      'contain',
      mail
    );
  }
);

defineStep(
  /la page contient (?:les|la) collectivités? "([^"]*)"/,
  collectiviteNames => {
    const names = collectiviteNames.split(',').map(s => s.trim());
    cy.get('[data-test=SimpleCollectiviteCard]').each(($el, index) =>
      cy.wrap($el).should('contain.text', names[index])
    );
  }
);

defineStep('la page ne contient aucune collectivité', () => {
  cy.get('[data-test=SimpleCollectiviteCard]').should('not.exist');
});
