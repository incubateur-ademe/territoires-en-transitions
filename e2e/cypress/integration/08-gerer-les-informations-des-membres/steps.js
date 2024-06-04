import {When} from '@badeball/cypress-cucumber-preprocessor';

import {Selectors} from '../common/selectors';
import {LocalSelectors} from './selectors';

const tableauMembresSelector = Selectors['tableau des membres'];

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap(LocalSelectors).as('LocalSelectors', {type: 'static'});
});

When('le tableau charge les informations', () => {
  cy.get(tableauMembresSelector.selector).within(() => {
    cy.get('[data-test=Loading]').should('be.visible');
    cy.get('[data-test=Loading]').should('not.exist');
  });
});

When(
  /le tableau des membres ne doit pas contenir l'utilisateur "([^"]+)"/,
  mail => {
    cy.get(tableauMembresSelector.selector).should('not.contain', mail);
  }
);

const FIELD = {
  fonction: {
    'Conseiller·e': 'conseiller',
    'Équipe politique': 'politique',
    'Équipe technique': 'technique',
    Partenaire: 'partenaire',
    'Référent·e': 'referent',
  },
  acces: {
    Admin: 'admin',
    Édition: 'edition',
    Lecture: 'lecture',
    "retirer l'acces": 'remove',
  },
  champ_intervention: {
    'Économie Circulaire': 'eci',
    'Climat Air Énergie': 'cae',
  },
};

const clickOnDropdownValue = (champ, email, value) => {
  if (champ === 'details_fonction') {
    getUtilisateurRow(email).within(() => {
      cy.root()
        .find('[data-test="details_fonction-textarea"]')
        .clear()
        .type(value + '{enter}');
    });
  } else {
    getUtilisateurRow(email).within(() => {
      cy.root()
        .find(`[data-test="${champ}-dropdown"] [aria-label="ouvrir le menu"]`)
        .click();
    });
    cy.root().get(`[data-test="${FIELD[champ][value]}"]`).click();
  }
};

When(
  /je modifie le champ "([^"]+)" de "([^"]+)" en "([^"]+)"/,
  clickOnDropdownValue
);
When(
  /je clique sur la valeur "([^"]+)" du champ "([^"]+)" de "([^"]+)"/,
  (value, champ, email) => clickOnDropdownValue(champ, email, value)
);

const getUtilisateurRow = email => cy.get(`[data-test="MembreRow-${email}"]`);

When(/je vois une modale intitulée "([^"]+)"/, titre => {
  cy.get(LocalSelectors['modale'].selector).should('contain', titre);
});

When(/je clique sur le bouton "([^"]+)" de la modale/, label => {
  cy.get('button').contains(label).click();
});

When('je clique sur le bouton {string} de {string}', (btn, email) => {
  getUtilisateurRow(email).find('button[data-test=delete]').click();
});