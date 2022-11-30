/// <reference types="Cypress" />
import '../05-modifier-etat-avancement/steps';

const suiviAuditTable = '[data-test="suivi-audit"]';

When(
  "le tableau de suivi de l'audit contient les lignes suivantes :",
  dataTable => {
    const rows = dataTable.rows();

    cy.get(`${suiviAuditTable}`).within(() => {
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

When(
  "je clique sur la ligne du tableau de suivi de l'audit contenant l'identifiant {string}",
  identifiant =>
    cy
      .get(`${suiviAuditTable} [role=row]`)
      .contains(identifiant)
      .siblings('span')
      .click()
);

When(
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

When(
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
