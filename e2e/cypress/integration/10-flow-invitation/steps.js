import {When} from '@badeball/cypress-cucumber-preprocessor';

import {LocalSelectors} from './selectors';
import {LocalSelectors as SignupSelectors} from '../09-creer-un-compte/selectors';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap({...SignupSelectors, ...LocalSelectors}).as('LocalSelectors', {
    type: 'static',
  });
});

When("un formulaire d'invitation est affiché", () => {
  cy.get(LocalSelectors["formulaire d'invitation"].selector).should(
    'be.visible'
  );
});

When("un message d'invitation est affiché", () => {
  cy.get(LocalSelectors["message d'invitation"].selector).should('be.visible');
});
When(
  /je renseigne l'email "([^"]+)" de la personne à inviter en "([^"]+)"/,
  (email, acces) => {
    cy.get('input[name="email"]').type('{selectall}{backspace}' + email);
    cy.get('select[name="acces"]').select(acces);
  }
);

When(/le tableau des membres doit contenir l'utilisateur "([^"]+)"/, mail => {
  cy.get(LocalSelectors['tableau des membres'].selector).should(
    'contain',
    mail
  );
});

When(
  /la page contient (?:les|la) collectivités? "([^"]*)"/,
  collectiviteNames => {
    const names = collectiviteNames.split(',').map(s => s.trim());
    cy.get('[data-test=SimpleCollectiviteCard]').each(($el, index) =>
      cy.wrap($el).should('contain.text', names[index])
    );
  }
);

When('la page ne contient aucune collectivité', () => {
  cy.get('[data-test=SimpleCollectiviteCard]').should('not.exist');
});
