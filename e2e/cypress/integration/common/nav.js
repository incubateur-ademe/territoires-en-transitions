/**
 * Steps dédiés à la navigation
 */
import {defineStep} from '@badeball/cypress-cucumber-preprocessor';
import {Views, CollectivitePages} from './views';

export const navigateTo = view => {
  const {route, selector} = Views[view];
  cy.get('@history').then(history => history.replace(route));
  cy.get(selector).should('be.visible');
};

// navigue sur une route sans recharger la page
defineStep(/visite la vue(?:.*)? "(.*)"/, view => navigateTo(view));

// navigue sur une sous-route associée à un item de menu
defineStep(/j'ouvre le dialogue "(.*)"/, menuItem =>
  navigateToSubRoute(menuItem)
);

// navigue sur un référentiel
defineStep(
  /visite le sous-axe "([^"]*)" du référentiel "([^"]*)" de la collectivité "(\d+)"/,
  (action, referentiel, collectiviteId) => {
    cy.visit(
      `/collectivite/${collectiviteId}/action/${referentiel}/${referentiel}_${action}`
    );
    cy.get(`[data-test="Action-${action}"]`).should('be.visible');
  }
);

// navigue sur un référentiel et un onglet
defineStep(
  /je visite l'onglet "([^"]*)" de l'action "([^"]*)" du référentiel "([^"]*)" de la collectivité "([^"]*)"/,
  (tabName, action, referentiel, collectiviteId) => {
    cy.visit(
      `/collectivite/${collectiviteId}/action/${referentiel}/${referentiel}_${action}/${tabName}`
    );
    cy.get(`[role=tabpanel] [data-test^=${tabName}]`).should('be.visible');
  }
);

defineStep(
  /je visite l'onglet "([^"]*)" du référentiel "([^"]*)" de la collectivité "([^"]*)"/,
  (tabName, referentiel, collectiviteId) => {
    cy.visit(
      `/collectivite/${collectiviteId}/referentiels/${referentiel}/${tabName}`
    );
  }
);

// navigue sur une page d'une collectivité
defineStep(
  /je suis sur la page "([^"]*)" de la collectivité "(\d+)"/,
  (page, collectiviteId) => {
    const {route, selector} = CollectivitePages[page];
    cy.visit(`/collectivite/${collectiviteId}/${route}`);
    cy.get(selector).should('be.visible');
  }
);

// vérifie qu'on est sur une route/vue
const isVisibleView = view => {
  const {selector} = Views[view];
  cy.get(selector).should('be.visible');
};
defineStep(/voi[rs] la vue(?: des)? "(.*)"/, isVisibleView);
defineStep(/la page "([^"]*)" est visible/, isVisibleView);

// vérifie qu'on est pas sur une route/vue
defineStep(/ne vois (?:pas|plus) la vue(?: des)? "(.*)"/, view => {
  const {selector} = Views[view];
  cy.get(selector).should('not.exist');
});

// vérifie qu'une vue est masquée
defineStep(/la vue(?: des)? "(.*)" est masquée/, view => {
  const {selector} = Views[view];
  cy.get(selector).should('be.hidden');
});
