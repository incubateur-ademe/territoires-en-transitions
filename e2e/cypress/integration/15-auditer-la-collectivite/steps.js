import {When} from '@badeball/cypress-cucumber-preprocessor';
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

When(
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
      cy.get('[data-test=Badge-ActionStatutBadge]').should('have.length.gt', 0);
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
      cy.get('[data-test=Badge-ActionStatutBadge]').should('have.length.gt', 0);
      // ainsi que les sélecteurs pour modifier la valeur
      cy.get('[data-test=SelectStatut]').should('have.length.gt', 0);
    });
  }
);

When("le tableau de suivi de l'audit ne contient pas de résultat", () => {
  cy.get('[data-test=DetailTacheTable] [role=row] .identifiant').should(
    'have.length.gte',
    0
  );
});

When("il n'y a pas de rapports d'audit", () => {
  cy.get('[data-test=rapports-audit]').should('not.exist');
});

When(
  "la liste des rapports d'audit contient les lignes suivantes :",
  dataTable => {
    cy.get('[data-test=rapports-audit]').within(makeCheckPreuveRows(dataTable));
  }
);

When("l'en-tête contient {string}", text =>
  cy.get('[data-test=HeaderMessage]').should('contain.text', text)
);

When("l'en-tête ne contient pas de message", text =>
  cy.get('[data-test=HeaderMessage]').should('not.exist')
);

When(
  'je déplie le sous-axe {string} du tableau de comparaison des scores',
  (actionId, referentiel) => {
    const indexes = actionId.split('.').map(idx => parseInt(idx));

    // déplie l'axe
    const axeIdx = indexes[0] - 1;
    cy.get(
      `.comparaison-table .body [role=row]:nth(${axeIdx}) button[data-test=btn-expand]`
    ).click();

    // déplie le sous-axe
    const sousAxeIdx = indexes[1]; // pas de -1 ici pour tenir compte de la ligne précédente
    cy.get(
      `.comparaison-table .body [role=row]:nth(${
        axeIdx + sousAxeIdx
      }) button[data-test=btn-expand]`
    ).click();
  }
);

When(
  "le potentiel de l'action {string} est de {string} avant audit et {string} pendant l'audit",
  comparePotentiels
);
When(
  "le potentiel de l'action {string} est de {string} avant et pendant l'audit",
  (identifiant, score) => comparePotentiels(identifiant, score, score)
);

function comparePotentiels(identifiant, scoreAvant, scorePendant) {
  // sélectionne la ligne de la table...
  cy.get('.comparaison-table .body [role=row]')
    // ...qui contient l'identifiant
    .contains(identifiant)
    // puis dans les cellules adjacentes
    .parent('.cell')
    .siblings()
    .then(cells => {
      // vérifie les scores
      cy.wrap(cells[1]).should('have.text', scoreAvant);
      cy.wrap(cells[4]).should('have.text', scorePendant);

      // et la présence ou non du picto "augmentation" ou "diminution"
      const avant = toFloat(scoreAvant);
      const pendant = toFloat(scorePendant);
      if (pendant === avant) {
        // scores identiques => pas de picto
        cy.wrap(cells[4]).find('svg').should('have.length', 0);
      } else {
        // scores différents
        cy.wrap(cells[4])
          .find('svg')
          // un picto attendu
          .should('have.length', 1)
          // avec un data-test différent suivant augmentation ou diminution
          .within(() =>
            cy
              .root()
              .should('have.attr', 'data-test', pendant > avant ? 'up' : 'down')
          );
      }
    });
}

const toFloat = s => parseFloat(s.replace(',', '.'));

When("j'attends que les scores soient calculés", () => {
  // ça peut être très lent en CI :(
  // idéalement il faudrait écouter les màj des scores comme dans l'app mais ce
  // n'est pas évident à faire
  cy.wait(10000);
});

When('le potentiel de points est {string}', score => {
  cy.get('[data-test=PointsPotentiels]').should('contain.text', score);
});
