/// <reference types="Cypress" />
import '../04-associer-des-preuves-aux-actions/steps';
import {
  makeCheckPreuveRows,
  checkPreuvesComplementaires,
  noPreuvesComplementaires,
} from '../04-associer-des-preuves-aux-actions/checkPreuves';
import { LocalSelectors as LocalSelectorsPreuves } from '../04-associer-des-preuves-aux-actions/selectors';
import { LocalSelectors } from './selectors';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap({ ...LocalSelectorsPreuves, ...LocalSelectors }).as('LocalSelectors');
});

When("il n'y a pas de documents de labellisation", () => {
  getLib().find('[data-test=labellisation]').should('not.exist');
});
When(
  'la liste des documents de labellisation contient les lignes suivantes :',
  (dataTable) => {
    getLib()
      .find('[data-test=labellisation]')
      .within(makeCheckPreuveRows(dataTable));
  }
);

When('la liste des documents de la page Labellisation est vide', () => {
  cy.get('[data-test=LabellisationPreuves]').should('not.exist');
});
When(
  'la liste des documents de la page Labellisation contient les lignes suivantes :',
  (dataTable) => {
    cy.get('[data-test=LabellisationPreuves]').within(
      makeCheckPreuveRows(dataTable)
    );
  }
);

When("il n'y a pas de rapports de visite annuelle", () => {
  getLib().find('[data-test=rapports] [data-test=item]').should('not.exist');
});

When(
  'la liste des rapports de visite contient les lignes suivantes :',
  (dataTable) => {
    getLib()
      .find('[data-test=rapports]')
      .within(makeCheckPreuveRows(dataTable));
  }
);

When('je saisi comme date de visite {string}', (date) =>
  cy.get('[data-test=date-visite] input[type=date]').type(date)
);

When(
  'je déplie la sous-action {string} du référentiel {string}',
  (actionId, referentiel) => {
    getRefentielIdentifiants(referentiel)
      .contains(actionId)
      .siblings()
      .find('button[title=Déplier]')
      .click();
  }
);

When(
  'la liste des preuves complémentaires associées à la sous-action {string} est vide',
  (actionId) => {
    noPreuvesComplementaires(cy.get(`[data-test="preuves-${actionId}"]`));
  }
);

When(
  'la liste des preuves complémentaires associées à la sous-action {string} contient les lignes suivantes :',
  (actionId, dataTable) => {
    checkPreuvesComplementaires(
      cy.get(`[data-test="preuves-${actionId}"]`),
      dataTable
    );
  }
);

When(
  'je clique sur le bouton "Ajouter une preuve" de la sous-action {string}',
  (actionId) => {
    cy.get(
      `[data-test="preuves-${actionId}"] [data-test=AddPreuveComplementaire]`
    ).click();
  }
);

const getLib = () => cy.get('[data-test=BibliothequeDocs]');
const getRefentielIdentifiants = (referentiel) =>
  getLib().find(
    `[role=tabpanel][data-test=${referentiel}] .referentiel-table .identifiant`
  );
