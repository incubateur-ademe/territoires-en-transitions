import {defineStep} from '@badeball/cypress-cucumber-preprocessor';
import {LocalSelectors} from './selectors';

// enregistre les définitions locales
beforeEach(() => {
  cy.wrap(LocalSelectors).as('LocalSelectors', {type: 'static'});
});

defineStep(
  /je sélectionne "([^"]+)" dans le champ "([^"]+)"/,
  (value, champ) => {
    cy.get(`[data-test=${champ}]`).select(value);
  }
);

defineStep(/le champ "([^"]+)" doit contenir "([^"]+)"/, (champ, value) => {
  cy.get(`[data-test=${champ}]`).should('have.value', value);
});

const inputSelector = 'input[name=collectiviteId]';
defineStep(
  /je recherche la collectivité "([^"]+)" dans le champ "([^"]+)"/,
  (value, champ) => {
    cy.get('[data-test="formulaire-RejoindreUneCollectivite"]').within(() => {
      // saisie dans le champ la valeur recherchée
      cy.get(inputSelector).type('{selectall}{backspace}' + value);
      // attends que la valeur apparaisse dans les résultats remontés par l'auto-complétion
      cy.get('div').contains(value).should('be.visible');
      // sélectionne la valeur au clavier (en supposant que c'est le 1er item de la liste de résultat)
      cy.get(inputSelector).type('{downArrow}{enter}');
    });
  }
);

defineStep(/une alerte contient le titre "([^"]+)"/, value => {
  cy.get(`.fr-alert`).find('h3').should('have.text', value);
});

defineStep(/une alerte contient le message "([^"]+)"/, value => {
  cy.wait(500); // attente de la requete
  cy.get(`.fr-alert`).find('p').should('have.text', value);
});

// lien vers tableau de bord
defineStep(/je clique sur le lien du formulaire/, () => {
  cy.get('[data-test="formulaire-RejoindreUneCollectivite"]').find('a').click();
});

defineStep(
  /la collectivité "([^"]+)" apparait dans le dropdown de sélection avec les droits d'accès relatifs à ma Fonction/,
  value => {
    cy.get('[data-test="SelectCollectivite"] button b').should(
      'have.text',
      value
    );
  }
);
