/// <reference types="Cypress" />

import {LocalSelectors} from './selectors';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap(LocalSelectors).as('LocalSelectors');
});

Given('le tableau charge les informations', () => {
  cy.get(LocalSelectors['tableau des membres'].selector).within(() => {
    cy.get('[data-test=Loading]').should('be.visible');
    cy.get('[data-test=Loading]').should('not.exist');
  });
});

Given(
  'le tableau des membres doit contenir les informations suivantes',
  (dataTable) => {
    cy.get(LocalSelectors['tableau des membres'].selector).within(() => {
      // Attend la disparition du chargement.
      cy.get('[data-test=Loading]').should('not.exist');
      cy.wrap(dataTable.rows()).each(
        (
          [
            nom,
            mail,
            telephone,
            fonction,
            champ_intervention,
            details_fonction,
            acces,
          ],
          index,
        ) => {
          cy.get(`tbody tr:nth(${index})`).within(() => {
            cy.get('td:first').should('contain.text', nom);
            cy.get('td:first').should('contain.text', mail);
            cy.get('td:nth(1)').should('contain.text', telephone);
            cy.get('td:nth(2)').should('contain.text', fonction);
            cy.get('td:nth(3)').should('contain.text', champ_intervention);
            cy.get('td:nth(4)').should('contain.text', details_fonction);
            cy.get('td:nth(5)').should('contain.text', acces);
          });
        },
      );
    });
  },
);

Given(
  /le tableau des membres ne doit pas contenir l'utilisateur "([^"]+)"/,
  (mail) => {
    cy.get(LocalSelectors['tableau des membres'].selector).should(
      'not.contain',
      mail,
    );
  },
);

const clickOnDropdownValue =   (champ, email, value) => {
    if (champ === 'details_fonction') {
      getUtilisateurRow(email).within(() => {
        cy.root().
          find('[data-test="details_fonction-textarea"]').
          clear().
          type(value + '{enter}');
      });
    } else {
      getUtilisateurRow(email).within(() => {
        cy.root().
          find(`[data-test="${champ}-dropdown"] [aria-label="ouvrir le menu"]`).
          click();
      });
      cy.root().get(`#floating-ui-root [aria-label="${value}"]`).click();
    }
  };

When(
  /je modifie le champ "([^"]+)" de "([^"]+)" en "([^"]+)"/,
  clickOnDropdownValue,
);
When(
  /je clique sur la valeur "([^"]+)" du champ "([^"]+)" de "([^"]+)"/,
  (value, champ, email) => clickOnDropdownValue(champ, email, value),
);

const getUtilisateurRow = (email) => cy.get(`[data-test="MembreRow-${email}"]`);


Given(
  /je vois une modale intitulée "([^"]+)"/,
  (titre) => {
    cy.get(LocalSelectors['modale'].selector).should(
      'contain',
      titre,
    );
  },
);

Given(
  /je clique sur le bouton "([^"]+)" de la modale/,
  (ariaLabel) => {
    cy.get(`[aria-label="${ariaLabel}"]`).click();
  },
);
