import {LocalSelectors} from './selectors';

// enregistre les définitions locales
beforeEach(() => {
  console.log('ok');
  cy.wrap(LocalSelectors).as('LocalSelectors');
});

Given(/le "formulaire rejoindre une collectivité" est visible/, () =>
  cy
    .get(`[data-test="formulaire-RejoindreUneCollectivite"]`)
    .should('be.visible')
);

Given(/je sélectionne "([^"]+)" dans le champ "([^"]+)"/, (value, champ) => {
  cy.get(`[data-test=${champ}]`).select(value);
});

Given(/le champ "([^"]+)" doit contenir "([^"]+)"/, (champ, value) => {
  cy.get(`[data-test=${champ}]`).should('have.value', value);
});

Given(
  /je recherche la collectivité "([^"]+)" dans le champ "([^"]+)"/,
  (value, champ) => {
    cy.get('[data-test="formulaire-RejoindreUneCollectivite"]')
      .find(`input[name=collectiviteId]`)
      .clear()
      .type(value)
      .wait(500) // attente de la requete
      .trigger('keydown', {keyCode: 40}) //fleche du bas
      .trigger('keydown', {keyCode: 13}); //enter
  }
);

Given(/une alerte contient le titre "([^"]+)"/, value => {
  cy.get(`.fr-alert`).find('h3').should('have.text', value);
});

Given(/je clique sur le bouton "Rejoindre en tant qu'admin"/, () => {
  cy.get('[data-test="BtnActiverCollectivite"]').click();
  cy.wait(500); // attente de la requete
});

Given(/une alerte contient le message "([^"]+)"/, value => {
  cy.get(`.fr-alert`).find('p').should('have.text', value);
});

// lien vers tableau de bord
Given(/je clique sur le lien du formulaire/, () => {
  cy.get('[data-test="formulaire-RejoindreUneCollectivite"]').find('a').click();
});

Given(
  /la collectivité "([^"]+)" apparait dans le dropdown de sélection avec les droits d'accès relatifs à ma Fonction/,
  value => {
    cy.get('[data-test="CollectiviteSwitchDropdown"]')
      .find('span')
      .should('have.text', value);
  }
);
