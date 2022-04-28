/// <reference types="Cypress" />

import { LocalSelectors } from './selectors';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap(LocalSelectors).as('LocalSelectors');
});

When(/je déplie le panneau Preuves de l'action "([^"]+)"/, (action) =>
  getPreuvePanel(action).within(() => {
    // la liste des preuves attendues n'existe pas
    cy.get('.content li').should('not.exist');
    // clic pour déplier le panneau
    cy.root().click();
    // attend que la liste existe
    cy.get('.content li').should('be.visible');
  })
);

When(
  /les tables de preuves de la collectivité "(\d+)" sont vides/,
  (collectivite_id) =>
    cy
      .get('@supabaseClient')
      .then((client) =>
        Promise.all([
          client.from('preuve_lien').delete().match({ collectivite_id }),
          client.from('preuve_fichier').delete().match({ collectivite_id }),
        ])
      )
);

When(
  /la table des liens preuve est initialisée avec les données suivantes/,
  (dataTable) => {
    cy.get('@supabaseClient').then((client) =>
      client.from('preuve_lien').insert(dataTable.hashes())
    );
  }
);

When(/la liste des preuves de l'action "([^"]+)" est vide/, (action) => {
  getPreuvePanel(action).find('[data-test=ActionPreuves]').should('not.exist');
});

When(
  /la liste des preuves de l'action "([^"]+)" contient les lignes suivantes/,
  (action, dataTable) => {
    const rows = dataTable.rows();
    getPreuvePanel(action)
      .find('[data-test=ActionPreuves] > div')
      .should('have.length', rows.length);
    cy.wrap(rows).each(([titre, commentaire], index) => {
      getPreuvePanel(action)
        .find(`[data-test=ActionPreuves] > div:nth(${index})`)
        .should('have.text', titre + commentaire);
    });
  }
);

When(
  /je clique sur la preuve "([^"]+)" de l'action "([^"]+)"/,
  (preuve, action) => {
    getPreuvePanel(action)
      .find(`[data-test=ActionPreuves] > div`)
      .contains(preuve)
      .click();
  }
);

When(
  /je clique sur le bouton "([^"]+)" de la preuve "([^"]+)" de l'action "([^"]+)"/,
  (btn, preuve, action) => {
    getPreuvePanel(action)
      .find(`[data-test=ActionPreuves] > div`)
      .contains(preuve)
      .parent()
      //      .trigger('mouseover')
      .find(`button[title=${btn}]`)
      .click({ force: true });
  }
);

When(
  /je saisi "([^"]+)" comme commentaire de la preuve "([^"]+)" de l'action "([^"]+)"/,
  (commentaire, preuve, action) => {
    getPreuvePanel(action)
      .find(`[data-test=ActionPreuves] input`)
      .clear()
      .type(commentaire + '{enter}');
  }
);

When(/l'ouverture du lien "([^"]+)" doit avoir été demandée/, (url) => {
  cy.get('@open').should('have.been.calledOnceWithExactly', url);
});

When(
  /clique sur le bouton "Ajouter une preuve" à l'action "([^"]+)"/,
  (action) => {
    // utilise le paramètre "force" pour le clic (sinon il ne se produit jamais ?)
    getAddPreuveButton(action).click({ force: true });
  }
);

When(
  /le bouton "Ajouter une preuve" à l'action "([^"]+)" est (visible|absent)/,
  (action, status) => {
    getAddPreuveButton(action).should(
      status === 'visible' ? 'be.visible' : 'not.exist'
    );
  }
);

const getAddPreuveButton = (action) =>
  getPreuvePanel(action).find('[data-test=AddPreuveButton]');

const getPreuvePanel = (action) =>
  cy.get(`[data-test="PreuvesPanel-${action}"]`);
