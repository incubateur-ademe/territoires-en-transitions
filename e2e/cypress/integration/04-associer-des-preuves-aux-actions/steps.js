/// <reference types="Cypress" />

import { LocalSelectors } from './selectors';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap(LocalSelectors).as('LocalSelectors');
});

When(/je déplie le panneau Preuves de l'action "([^"]+)"/, (action) =>
  getPreuvePanel(action).within(() => {
    // la liste des preuves attendues n'existe pas
    cy.get('[data-test=preuves]').should('not.exist');
    // clic pour déplier le panneau
    cy.root().click();
    // attend que la liste existe
    cy.get('[data-test=preuves]').should('be.visible');
  })
);

When(
  /les tables de preuves de la collectivité "(\d+)" sont vides/,
  (collectivite_id) => {
    cy.get('@supabaseClient').then((client) =>
      Promise.all([
        client.from('preuve_reglementaire').delete().match({ collectivite_id }),
        client
          .from('preuve_complementaire')
          .delete()
          .match({ collectivite_id }),
        client.from('preuve_labellisation').delete().match({ collectivite_id }),
        client.from('preuve_rapport').delete().match({ collectivite_id }),
      ])
    );
    cy.task('pg_query', {
      query:
        'DELETE FROM labellisation.bibliotheque_fichier WHERE collectivite_id = $1',
      values: [collectivite_id],
    });
  }
);

When(
  /la table des liens preuve est initialisée avec les données suivantes/,
  (dataTable) => {
    cy.get('@supabaseClient').then((client) =>
      client.from('preuve_complementaire').insert(dataTable.hashes())
    );
  }
);

When(/la liste des preuves de l'action "([^"]+)" est vide/, (action) => {
  getPreuvePanel(action)
    .find('[data-test=preuves] [data-test=item]')
    .should('not.exist');
});

When(
  /la liste des preuves de l'action "([^"]+)" contient les lignes suivantes/,
  (action, dataTable) => {
    const rows = dataTable.rows();
    getPreuvePanel(action)
      .find('[data-test=preuves]')
      .within(() => {
        // vérifie le nombre de lignes
        cy.root().get('[data-test=item]').should('have.length', rows.length);

        // vérifie que chaque ligne du tableau donné correspond à l'affichage
        cy.wrap(rows).each(([titre, commentaire], index) => {
          cy.get(`[data-test=item]:nth(${index})`).within(() => {
            // vérifie le nom
            cy.get('[data-test=name]').should('contain.text', titre);
            // et le commentaire (ou son absence)
            if (commentaire) {
              cy.get('[data-test=comment]').should('have.text', commentaire);
            } else {
              cy.get('[data-test=comment]').should('not.exist');
            }
          });
        });
      });
  }
);

When(
  /je clique sur la preuve "([^"]+)" de l'action "([^"]+)"/,
  (preuve, action) => {
    getPreuvePanel(action)
      .find(`[data-test=preuves] > div`)
      .contains(preuve)
      .click();
  }
);

When(
  /je clique sur le bouton "([^"]+)" de la preuve "([^"]+)" de l'action "([^"]+)"/,
  (btn, preuve, action) => {
    getPreuvePanel(action)
      .find(`[data-test=preuves] > div`)
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
      .find(`[data-test=preuves] input`)
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
  getPreuvePanel(action).find('[data-test=AddPreuveComplementaire]');

const getPreuvePanel = (action) =>
  cy.get(`[data-test="PreuvesPanel-${action}"]`);
