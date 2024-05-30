import {When} from '@badeball/cypress-cucumber-preprocessor';

import {LocalSelectors} from './selectors';
import {LocalSelectors as LoginSelector} from '../01-se-connecter/selectors';
import {LocalSelectors as SignupSelectors} from '../09-creer-un-compte/selectors';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap({...LoginSelector, ...SignupSelectors, ...LocalSelectors}).as(
    'LocalSelectors',
    {
      type: 'static',
    }
  );
});

When("un formulaire d'invitation est affiché", () => {
  cy.get(LocalSelectors["formulaire d'invitation"].selector).should(
    'be.visible'
  );
});

When(
  /je renseigne l'email "([^"]+)" de la personne à inviter en "([^"]+)"/,
  (email, niveau) => {
    cy.get('input[name="email"]').type('{selectall}{backspace}' + email);
    cy.get('[data-test=niveau]').click();
    cy.get(`[data-test=niveau-options] button[data-test=${niveau}]`).click();
  }
);

When(/le tableau des membres doit contenir l'utilisateur "([^"]+)"/, mail => {
  cy.get(LocalSelectors['tableau des membres'].selector).should(
    'contain.text',
    mail
  );
});

When(/le tableau des membres n'inclus pas l'utilisateur "([^"]+)"/, mail => {
  cy.get(LocalSelectors['tableau des membres'].selector).should(
    'not.contain.text',
    mail
  );
});

When(
  'le tableau des membres indique que le compte {string} est en attente de création',
  mail => {
    cy.get(`[data-test="MembreRow-${mail}"]`)
      .should('contain.text', mail)
      .should('contain.text', 'Création de compte en attente');
  }
);

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
