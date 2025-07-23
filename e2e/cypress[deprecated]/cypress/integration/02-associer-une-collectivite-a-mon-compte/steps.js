import {When} from '@badeball/cypress-cucumber-preprocessor';
import {LocalSelectors} from './selectors';
import {resolveSelector} from '../common/steps';

// enregistre les définitions locales
beforeEach(() => {
  cy.wrap(LocalSelectors).as('LocalSelectors', {type: 'static'});
});

When(/je sélectionne "([^"]+)" dans le champ "([^"]+)"/, (value, champ) => {
  cy.get(`[data-test=${champ}]`).select(value);
});

When(/le champ "([^"]+)" doit contenir "([^"]+)"/, (champ, value) => {
  cy.get(`[data-test=${champ}]`).should('have.value', value);
});

When(
  /je recherche la collectivité "([^"]+)" dans le champ "([^"]+)"/,
  function (value, champ) {
    // saisie dans le champ la valeur recherchée
    cy.get(`[data-test=${champ}]`).type('{selectall}{backspace}' + value);
    // attends que la valeur apparaisse dans les résultats remontés par l'auto-complétion
    cy.get('div').contains(value).should('be.visible');
    // sélectionne la valeur
    cy.get(`[data-test=${champ}-options]`).contains(value).click();
  }
);

// lien vers tableau de bord
When('je clique sur le lien du formulaire', () => {
  cy.get('[data-test=dialog-AssocierCollectivite] a').click();
});

When(
  /la collectivité "([^"]+)" apparait dans le dropdown de sélection avec les droits d'accès relatifs à ma Fonction/,
  value => {
    cy.get('[data-test="SelectCollectivite"] button b').should(
      'have.text',
      value
    );
  }
);
