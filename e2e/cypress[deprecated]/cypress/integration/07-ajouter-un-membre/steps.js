import { When } from '@badeball/cypress-cucumber-preprocessor';

import { LocalSelectors as LoginSelector } from '../01-se-connecter/selectors';
import { LocalSelectors as SignupSelectors } from '../09-creer-un-compte/selectors';
import { Selectors } from '../common/selectors';
import { LocalSelectors } from './selectors';

const tableauMembresSelector = Selectors['tableau des membres'];

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap({ ...LoginSelector, ...SignupSelectors, ...LocalSelectors }).as(
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

When(/le tableau des membres doit contenir l'utilisateur "([^"]+)"/, (mail) => {
  cy.get(LocalSelectors['tableau des membres'].selector).should(
    'contain.text',
    mail
  );
});

When(/le tableau des membres n'inclus pas l'utilisateur "([^"]+)"/, (mail) => {
  cy.get(LocalSelectors['tableau des membres'].selector).should(
    'not.contain.text',
    mail
  );
});

When(
  'le tableau des membres indique que le compte {string} est en attente de création',
  (mail) => {
    cy.get(`[data-test="MembreRow-${mail}"]`)
      .should('contain.text', mail)
      .should('contain.text', 'Création de compte en attente');
  }
);

When(
  /la page contient (?:les|la) collectivités? "([^"]*)"/,
  (collectiviteNames) => {
    const names = collectiviteNames.split(',').map((s) => s.trim());
    cy.get('[data-test=SimpleCollectiviteCard]').each(($el, index) =>
      cy.wrap($el).should('contain.text', names[index])
    );
  }
);

When('la page ne contient aucune collectivité', () => {
  cy.get('[data-test=SimpleCollectiviteCard]').should('not.exist');
});

When('le tableau charge les informations', () => {
  cy.get(tableauMembresSelector.selector).within(() => {
    cy.get('[data-test=Loading]').should('be.visible');
    cy.get('[data-test=Loading]').should('not.exist');
  });
});

When(
  /le tableau des membres ne doit pas contenir l'utilisateur "([^"]+)"/,
  (mail) => {
    cy.get(tableauMembresSelector.selector).should('not.contain', mail);
  }
);

const FIELD = {
  fonction: {
    'Conseiller·e': 'conseiller',
    'Équipe politique': 'politique',
    'Équipe technique': 'technique',
    Partenaire: 'partenaire',
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

const getUtilisateurRow = (email) => cy.get(`[data-test="MembreRow-${email}"]`);

When(/je vois une modale intitulée "([^"]+)"/, (titre) => {
  cy.get(LocalSelectors['modale'].selector).should('contain', titre);
});

When(/je clique sur le bouton "([^"]+)" de la modale/, (label) => {
  cy.get('button').contains(label).click();
});

When('je clique sur le bouton {string} de {string}', (btn, email) => {
  getUtilisateurRow(email).find(LocalSelectors[btn].selector).click();
});
