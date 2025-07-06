import {When} from '@badeball/cypress-cucumber-preprocessor';
import {LocalSelectors} from './selectors';
import {clickOutside} from '../common/shared';

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


const getTable = label =>
  `[label=${label[0].toUpperCase()}${label.slice(1)}] table tbody`;

When(/le tableau des (résultats|objectifs) de l'indicateur est vide/, label => {
  // vide = 1 seule ligne car il y a la ligne qui permet de saisir une nouvelle valeur
  cy.get(`${getTable(label)} tr`).should('have.length', 1);
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

When(
  /j'ajoute (?:le |l')(résultat|objectif) (\d+) pour l'année (\d+)/,
  (label, value, year) => {
    cy.get(`${getTable(`${label}s`)} tr:nth(0)`).within(() => {
      cy.get('td:nth(1) input').click().type(year);
      cy.get('td:nth(2) input').click().type(value);
      cy.get('td:nth(3)').click();
    });
  }
);

When("j'ajoute le commentaire {string} à la ligne {int}", (comment, row) => {
  cy.get(`[label=Résultats] table tbody tr:nth(${row}) td:nth(3) textarea`)
    .click()
    .type(comment);
  clickOutside();
});

When(
  /le tableau des (résultats|objectifs) de l'indicateur contient :/,
  (label, dataTable) => {
    const rows = dataTable.rows();
    cy.get(getTable(label)).within(() => {
      // clique sur le bouton "afficher tous les objectifs" si il y a plus de 2 lignes
      // TODO: comprendre pourquoi ce n'est pas nécessaire pour le tableau "résultats"
      if (rows.length > 2 && label === 'objectifs') {
        cy.get('a[aria-expanded=false]').click();
      }

      // vérifie le nombre de lignes
      cy.get('tr').should(
        'have.length',
        rows.length +
          // +1 pour la ligne vide permettant d'ajouter une nouvelle valeur
          1 +
          // +1 optionnel pour la ligne "Afficher tous les résultats/uniquemeent les
          // résultats récents" quand il y a plus de 2 valeurs
          (rows.length > 2 ? 1 : 0)
      );

      // vérifie que chaque ligne du tableau donné correspond à l'affichage
      cy.wrap(rows).each(checkRow);
    });
  }
);

const checkRow = ([annee, resultat, commentaire], index) =>
  cy.get(`tr:nth(${index + 1})`).within(() => {
    cy.get('td:nth(1) input').should('have.value', annee);
    cy.get('td:nth(2) input').should('have.value', resultat);
    if (commentaire) {
      cy.get('td:nth(3) textarea').should('have.value', commentaire);
    } else {
      cy.get('td:nth(3) textarea').should('be.empty');
    }

    // le bouton "..." est présent
    //    cy.get('button[aria-label="sous-menu"]').should('be.visible');
  });

When(
  /le tableau des (résultats|objectifs) est en lecture seule et contient :/,
  (label, dataTable) => {
    const rows = dataTable.rows();
    cy.get(getTable(label)).within(() => {
      // vérifie le nombre de lignes
      cy.get('tr').should('have.length', rows.length);

      // vérifie que chaque ligne du tableau donné correspond à l'affichage
      cy.wrap(rows).each(checkRowReadOnly);
    });
  }
);

const checkRowReadOnly = ([annee, resultat, commentaire], index) =>
  cy.get(`tr:nth(${index})`).within(() => {
    cy.get('td:nth(1)').should('have.text', annee);
    cy.get('td:nth(2)').should('have.text', resultat);
    if (commentaire) {
      cy.get('td:nth(3)').should('have.text', commentaire);
    } else {
      cy.get('td:nth(3)').should('be.empty');
    }

    // le bouton "..." est absent
    cy.get('button[aria-label="sous-menu"]').should('not.exist');
  });

When("je crée l'indicateur avec les données suivantes :", dataTable => {
  const rows = dataTable.rows();
  const [nom, unite, desc, thematique] = rows[0];
  cy.get('input#titre').click().type(nom);
  cy.get('input#unite').click().type(unite);
  cy.get('textarea#description').click().type(desc);
  cy.get(LocalSelectors['Thématique'].selector).click();
  cy.get(`[data-test=thematiques-options] button`).contains(thematique).click();
  cy.get('button[data-test=ok]').click({force: true});
});

When(
  "l'indicateur {string} dispose de données {string} de type {string} avec les valeurs suivantes :",
  (identifiant, sourceId, type, dataTable) => {
    const rows = dataTable.rows();

    // récupère l'id de l'indicateur
    cy.task('supabase_select', {
      table: 'indicateur_definition',
      columns: 'id',
      match: {identifiant_referentiel: identifiant},
    }).then(({data}) => {
      const indicateur_id = data[0].id;

      // insère une source de données
      cy.task('supabase_insert', {
        table: 'indicateur_source_metadonnee',
        values: {
          source_id: sourceId,
          date_version: new Date().toISOString(),
          diffuseur: 'ORCAE',
          producteur: 'Atmo AURA',
          methodologie:
            'inventaire cadastral des émissions de GES / scope 1 & 2',
          limites: 'secrétisation des données pour certains secteurs',
        },
        columns: 'id',
      }).then(({data}) => {
        const metadonnee_id = data[0].id;

        // récupère l'id de la collectivité courante
        cy.get('@collectivite').then(({collectivite_id}) => {
          // insère des valeurs
          cy.task('supabase_insert', {
            table: 'indicateur_valeur',
            values: rows.map(([annee, valeur]) => ({
              indicateur_id,
              date_valeur: `${annee}-01-01`,
              collectivite_id,
              [type]: valeur,
              metadonnee_id,
            })),
          });
        });
      });
    });
  }
);

When('le sélecteur de sources contient {string}', sources => {
  const values = sources.split(',').map(s => s.trim());
  values.forEach((source, i) =>
    cy.get(`[data-test=sources] li:nth(${i})`).should('have.have.text', source)
  );
});

When('le sélecteur de sources est absent', () => {
  cy.get(`[data-test=sources]`).should('not.exist');
});

When('la source {string} est sélectionnée', source => {
  cy.get(`[data-test=sources] li`)
    .contains(source)
    .should('have.attr', 'aria-selected', 'true');
});

When('je sélectionne la source {string}', source => {
  cy.get(`[data-test=sources] li`).contains(source).click();
});

When('le dialogue de résolution des conflits contient :', dataTable => {
  const rows = dataTable.rows();
  rows.forEach(([annee, valeur, valeurSource, nouvelleValeur], i) => {
    cy.get(`[data-test=avant] tr:nth(${i})`).within(() => {
      cy.get('td:nth(0)').should('contain.text', annee);
      cy.get('td:nth(1)').should('contain.text', valeur);
      cy.get('td:nth(2)').should('contain.text', valeurSource);
    });
    cy.get(`[data-test=apres] tr:nth(${i}) td:nth(0)`).should(
      'contain.text',
      nouvelleValeur
    );
  });
});

When(/je clique sur l'onglet (Résultats|Objectifs)/, label => {
  cy.get(`button[role=tab]`).contains(label).click();
});
