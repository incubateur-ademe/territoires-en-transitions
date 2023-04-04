import {defineStep} from '@badeball/cypress-cucumber-preprocessor';
import '../04-associer-des-preuves-aux-actions/steps';
import {
  makeCheckPreuveRows,
  checkPreuvesComplementaires,
  noPreuvesComplementaires,
} from '../04-associer-des-preuves-aux-actions/checkPreuves';
import {LocalSelectors as LocalSelectorsPreuves} from '../04-associer-des-preuves-aux-actions/selectors';
import {LocalSelectors} from './selectors';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap({...LocalSelectorsPreuves, ...LocalSelectors}).as('LocalSelectors', {
    type: 'static',
  });
});

defineStep("il n'y a pas de documents de labellisation", () => {
  getLib().find('[data-test=labellisation]').should('not.exist');
});
defineStep(
  'la liste des documents de labellisation contient les lignes suivantes :',
  dataTable => {
    getLib()
      .find('[data-test=labellisation]')
      .within(makeCheckPreuveRows(dataTable));
  }
);

defineStep('la liste des documents de la page Labellisation est vide', () => {
  cy.get('[data-test=LabellisationPreuves]').should('not.exist');
});
defineStep(
  'la liste des documents de la page Labellisation contient les lignes suivantes :',
  dataTable => {
    cy.get('[data-test=LabellisationPreuves]').within(
      makeCheckPreuveRows(dataTable)
    );
  }
);

defineStep("il n'y a pas de rapports de visite annuelle", () => {
  getLib().find('[data-test=rapports] [data-test=item]').should('not.exist');
});

defineStep(
  'la liste des rapports de visite contient les lignes suivantes :',
  dataTable => {
    getLib()
      .find('[data-test=rapports]')
      .within(makeCheckPreuveRows(dataTable));
  }
);

defineStep('je saisi comme date de visite {string}', date =>
  cy.get('[data-test=date-visite] input[type=date]').type(date)
);

defineStep(
  'je déplie la sous-action {string} du référentiel {string}',
  (actionId, referentiel) => {
    getRefentielIdentifiants(referentiel)
      .contains(actionId)
      .siblings()
      .find('button[data-test=btn-expand]')
      .click();
  }
);

defineStep(
  'la liste des preuves complémentaires associées à la sous-action {string} est vide',
  actionId => {
    noPreuvesComplementaires(cy.get(`[data-test="preuves-${actionId}"]`));
  }
);

defineStep(
  'la liste des preuves complémentaires associées à la sous-action {string} contient les lignes suivantes :',
  (actionId, dataTable) => {
    checkPreuvesComplementaires(
      cy.get(`[data-test="preuves-${actionId}"]`),
      dataTable
    );
  }
);

defineStep(
  'je clique sur le bouton "Ajouter une preuve" de la sous-action {string}',
  actionId => {
    cy.get(
      `[data-test="preuves-${actionId}"] [data-test=AddPreuveComplementaire]`
    ).click();
  }
);

const getLib = () => cy.get('[data-test=BibliothequeDocs]');
const getRefentielIdentifiants = referentiel =>
  getLib().find(
    `[role=tabpanel][data-test=${referentiel}] .referentiel-table .identifiant`
  );
