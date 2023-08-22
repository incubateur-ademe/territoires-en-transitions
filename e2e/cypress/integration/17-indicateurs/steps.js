import {When} from '@badeball/cypress-cucumber-preprocessor';
import {LocalSelectors} from './selectors';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap(LocalSelectors).as('LocalSelectors', {type: 'static'});
});

When('la page contient au moins {int} graphique(s) vide(s)', count => {
  cy.get('[data-test^=chart] [data-test=pie]').should('have.length.gte', count);
});

When('la page ne contient pas de graphiques vides', () => {
  cy.get('[data-test^=chart] [data-test=pie]').should('not.exist');
});

When('je clique sur le {int}er/ème graphique', num => {
  cy.get(`[data-test^=chart-]:nth(${num - 1})`).click();
});

When("le tableau des résultats de l'indicateur est vide", () => {
  // vide = 1 seule ligne car il y a la ligne qui permet de saisir une nouvelle valeur
  cy.get('[label=Résultats] table tbody tr').should('have.length', 1);
});

When("le graphique de l'indicateur est vide", () => {
  cy.get('[data-test^=chart-]')
    .should('have.length', 1)
    .find('[data-test=pie]')
    .should('be.visible');
});
When("le graphique de l'indicateur n'est pas vide", () => {
  cy.get('[data-test^=chart-]')
    .should('have.length', 1)
    .scrollIntoView()
    .find('[data-test=pie]')
    .should('not.exist');
});

When("j'ajoute le résultat {int} pour l'année {int}", (value, year) => {
  cy.get('[label=Résultats] table tbody tr:nth(0)').within(() => {
    cy.get('td:nth(0) input').click().type(year);
    cy.get('td:nth(1) input').click().type(value);
    cy.get('td:nth(2)').click();
  });
});

When("j'ajoute le commentaire {string} à la ligne {int}", (comment, row) => {
  cy.get(`[label=Résultats] table tbody tr:nth(${row}) td:nth(2) textarea`)
    .click()
    .type(comment);
  cy.get('body').click(10, 10);
});

When("le tableau des résultats de l'indicateur contient :", dataTable => {
  const rows = dataTable.rows();
  cy.get('[label=Résultats] table tbody').within(() => {
    // vérifie le nombre de lignes
    cy.get('tr').should('have.length', rows.length + 1);

    // vérifie que chaque ligne du tableau donné correspond à l'affichage
    cy.wrap(rows).each(checkRow);
  });
});

const checkRow = ([annee, resultat, commentaire], index) =>
  cy.get(`tr:nth(${index + 1})`).within(() => {
    cy.get('td:nth(0) input').should('have.value', annee);
    cy.get('td:nth(1) input').should('have.value', resultat);
    if (commentaire) {
      cy.get('td:nth(2) textarea').should('have.value', commentaire);
    } else {
      cy.get('td:nth(2) textarea').should('be.empty');
    }

    // le bouton "..." est présent
    cy.get('button[aria-label="sous-menu"]').should('be.visible');
  });

When(
  'le tableau des résultats est en lecture seule et contient :',
  dataTable => {
    const rows = dataTable.rows();
    cy.get('[label=Résultats] table tbody').within(() => {
      // vérifie le nombre de lignes
      cy.get('tr').should('have.length', rows.length);

      // vérifie que chaque ligne du tableau donné correspond à l'affichage
      cy.wrap(rows).each(checkRowReadOnly);
    });
  }
);

const checkRowReadOnly = ([annee, resultat, commentaire], index) =>
  cy.get(`tr:nth(${index})`).within(() => {
    cy.get('td:nth(0)').should('have.text', annee);
    cy.get('td:nth(1)').should('have.text', resultat);
    if (commentaire) {
      cy.get('td:nth(2)').should('have.text', commentaire);
    } else {
      cy.get('td:nth(2)').should('be.empty');
    }

    // le bouton "..." est absent
    cy.get('button[aria-label="sous-menu"]').should('not.exist');
  });

When("je crée l'indicateur avec les données suivantes :", dataTable => {
  const rows = dataTable.rows();
  const [nom, unite, desc] = rows[0];
  cy.get('input#titre').click().type(nom);
  cy.get('input#unite').click().type(unite);
  cy.get('textarea#description').click().type(desc);
  cy.get('button[type=submit]').click();
});
