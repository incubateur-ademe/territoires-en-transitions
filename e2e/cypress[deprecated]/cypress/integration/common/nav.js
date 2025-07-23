/**
 * Steps dédiés à la navigation
 */
import { When } from '@badeball/cypress-cucumber-preprocessor';
import { CollectivitePages, Views } from './views';

export const navigateTo = (view) => {
  const { route, selector } = Views[view];
  cy.visit(route);
  cy.get(selector).should('be.visible');
};

// navigue sur une route sans recharger la page
When(/visite la vue(?:.*)? "(.*)"/, (view) => navigateTo(view));

// navigue sur une sous-route associée à un item de menu
When(/j'ouvre le dialogue "(.*)"/, (menuItem) => navigateToSubRoute(menuItem));

// navigue sur un référentiel
When(
  /visite le sous-axe "([^"]*)" du référentiel "([^"]*)" de la collectivité "(\d+)"/,
  (action, referentiel, collectiviteId) => {
    cy.visit(
      `/collectivite/${collectiviteId}/referentiel/${referentiel}/action/${referentiel}_${action}/`
    );
    cy.get(`[data-test="Action-${action}"]`).should('be.visible');
  }
);

// navigue sur un référentiel et un onglet
When(
  /je visite l'onglet "([^"]*)" de l'action "([^"]*)" du référentiel "([^"]*)" de la collectivité "([^"]*)"/,
  (tabName, action, referentiel, collectiviteId) => {
    cy.visit(
      `/collectivite/${collectiviteId}/referentiel/${referentiel}/action/${referentiel}_${action}/${tabName}`
    );
    cy.get(`[role=tabpanel] [data-test^=${tabName}]`).should('be.visible');
  }
);

When(
  /je visite l'onglet "([^"]*)" du référentiel "([^"]*)" de la collectivité "([^"]*)"/,
  (tabName, referentiel, collectiviteId) => {
    cy.visit(
      `/collectivite/${collectiviteId}/referentiels/${referentiel}/${tabName}`
    );
  }
);

// navigue sur une page d'une collectivité
When(
  /je suis sur la page "([^"]*)" de la collectivité "(\d+)"/,
  (page, collectiviteId) => {
    const { route, selector } = CollectivitePages[page];
    cy.visit(`/collectivite/${collectiviteId}/${route}`);
    cy.get(selector).should('be.visible');
  }
);

// vérifie qu'on est sur une route/vue
const isVisibleView = (view) => {
  const { selector } = Views[view] || CollectivitePages[view];
  cy.get(selector).should('be.visible');
};
When(/voi[rs] la vue(?: des)? "(.*)"/, isVisibleView);
When(/la page "([^"]*)" est visible/, isVisibleView);

// vérifie qu'on est pas sur une route/vue
When(/ne vois (?:pas|plus) la vue(?: des)? "(.*)"/, (view) => {
  const { selector } = Views[view];
  cy.get(selector).should('not.exist');
});

// vérifie qu'une vue est masquée
When(/la vue(?: des)? "(.*)" est masquée/, (view) => {
  const { selector } = Views[view];
  cy.get(selector).should('be.hidden');
});

// teste les redirections
const redirectedTo = {
  app: 'http://localhost:3000',
  authentification: 'http://localhost:3003',
  panier: 'http://localhost:3002',
};
const checkRedirect = (appName) => {
  assert(redirectedTo[appName], `l'url correspondant à "${appName} est défini`);
  cy.url().should('contain', redirectedTo[appName]);
};
When(/je suis redirigé sur l'(.*)/, checkRedirect);
When(/je suis redirigé sur le (.*)/, checkRedirect);

When('je clique sur le lien {string}', (text) => {
  cy.get('a').contains(text).click();
});
