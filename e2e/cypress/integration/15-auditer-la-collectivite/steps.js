import {defineStep} from '@badeball/cypress-cucumber-preprocessor';
import '../05-modifier-etat-avancement/steps';
import '../12-utiliser-la-bibliotheque/steps';
import '../14-demander-un-audit/steps';
import {LocalSelectors as LocalSelectorsPreuves} from '../04-associer-des-preuves-aux-actions/selectors';
import {LocalSelectors as LocalSelectorsStatut} from '../05-modifier-etat-avancement/selectors';
import {LocalSelectors as LocalSelectorsLabellisation} from '../14-demander-un-audit/selectors';
import {LocalSelectors} from './selectors';
import {makeCheckPreuveRows} from '../04-associer-des-preuves-aux-actions/checkPreuves';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap({
    ...LocalSelectorsPreuves,
    ...LocalSelectorsStatut,
    ...LocalSelectorsLabellisation,
    ...LocalSelectors,
  }).as('LocalSelectors', {type: 'static'});
});

const suiviAuditTable = '[data-test="suivi-audit"]';

defineStep(
  "le tableau de suivi de l'audit contient les lignes suivantes :",
  dataTable => {
    const rows = dataTable.rows();

    cy.get(suiviAuditTable).within(() => {
      // vérifie le nombre de lignes
      cy.get('[role=row] .identifiant').should('have.length.gte', rows.length);

      // vérifie que chaque ligne du tableau donné correspond à l'affichage
      cy.wrap(rows).each(checkRow);
    });
  }
);

const checkRow = ([identifiant, odj, avancement]) =>
  cy
    .get('[role=row]')
    .contains(identifiant)
    .parents('[role=row]')
    .within(() => {
      if (odj === 'oui') {
        // inscrit à l'ordre du jour de la prochaine séance d'audit
        cy.get('[role=cell]:nth(1) span').should(
          'have.class',
          'fr-fi-check-line'
        );
      } else {
        cy.get('[role=cell]:nth(1)').should('be.empty');
      }

      cy.get('[role=cell]:nth(2)').should('have.text', avancement);
    });

defineStep(
  "je clique sur la ligne du tableau de suivi de l'audit contenant l'identifiant {string}",
  identifiant =>
    cy
      .get(`${suiviAuditTable} [role=row]`)
      .contains(identifiant)
      .siblings('span')
      .click()
);

defineStep(
  "l'état d'avancement n'est pas éditable depuis le tableau de détail des tâches",
  () => {
    cy.get('[data-test=DetailTacheTable]').within(() => {
      // les badges sont présents
      cy.get('[data-test=ActionStatutBadge]').should('have.length.gt', 0);
      // mais pas les sélecteurs pour modifier la valeur
      cy.get('[data-test=SelectStatut]').should('not.exist');
    });
  }
);

defineStep(
  "l'état d'avancement est éditable depuis le tableau de détail des tâches",
  () => {
    cy.get('[data-test=DetailTacheTable]').within(() => {
      // les badges sont présents
      cy.get('[data-test=ActionStatutBadge]').should('have.length.gt', 0);
      // ainsi que les sélecteurs pour modifier la valeur
      cy.get('[data-test=SelectStatut]').should('have.length.gt', 0);
    });
  }
);

defineStep("le tableau de suivi de l'audit ne contient pas de résultat", () => {
  cy.get('[data-test=DetailTacheTable] [role=row] .identifiant').should(
    'have.length.gte',
    0
  );
});

defineStep("il n'y a pas de rapports d'audit", () => {
  cy.get('[data-test=rapports-audit]').should('not.exist');
});

defineStep(
  "la liste des rapports d'audit contient les lignes suivantes :",
  dataTable => {
    cy.get('[data-test=rapports-audit]').within(makeCheckPreuveRows(dataTable));
  }
);

defineStep("l'en-tête contient {string}", text =>
  cy.get('[data-test=HeaderMessage]').should('contain.text', text)
);

defineStep("l'en-tête ne contient pas de message", text =>
  cy.get('[data-test=HeaderMessage]').should('not.exist')
);
