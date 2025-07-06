import { When } from '@badeball/cypress-cucumber-preprocessor';
import { LocalSelectors } from './selectors';

// enregistre les définitions locales
beforeEach(() => {
  cy.wrap(LocalSelectors).as('LocalSelectors', { type: 'static' });
});

When("aucun score n'est affiché", () => {
  cy.get('[data-test^=score-]').should('not.exist');
});

/*
When('tous les scores sont à 0', () => {
  cy.get('[data-test^=score-]').each((el) =>
    cy.wrap(el).should('have.text', '0 %')
  );
});
*/

When('les scores sont affichés avec les valeurs suivantes :', (dataTable) => {
  cy.wrap(dataTable.rows()).each(([action, score]) => {
    cy.get(`[data-test="score-${action}"]`).should('contain.text', score);
  });
});

When(
  /j'assigne la valeur "([^"]+)" à l'état d'avancement de la tâche "([^"]+)"/,
  (avancement, tache) => {
    // ouvre le composant Select
    cy.get(`[data-test="task-${tache}"] [data-test=SelectStatut]`)
      .should('exist')
      .scrollIntoView()
      .click();

    // la liste déroulante doit être visible
    cy.get('[data-test=SelectStatut-options]')
      .should('be.visible')
      // et sélectionne l'option voulue
      .find(`[data-test="${avancementToValue[avancement]}"]`)
      .click();
  }
);

When("l'état d'avancement des tâches n'est pas éditable", () => {
  // aucun select n'est affiché
  cy.get('[data-test^="task-"] [data-test=SelectStatut]').should('not.exist');
});

When("l'état d'avancement des tâches est éditable", () => {
  // récupère le nombre de tâches
  const taches = '[data-test^="task-"]';
  cy.get(taches)
    .its('length')
    .then((tasksCount) => {
      expect(tasksCount).to.be.greaterThan(0);
      // et vérifie qu'il y a autant de select que de tâches
      cy.get(`${taches} [data-test=SelectStatut]`).should(
        'have.length',
        tasksCount
      );
    });
});

const avancementToValue = {
  'Non renseigné': 'non_renseigne',
  Fait: 'fait',
  Programmé: 'programme',
  'Pas fait': 'pas_fait',
  Détaillé: 'detaille',
  'Non concerné': 'non_concerne',
};

When(
  /je saisi "([^"]+)" dans le champ "Précisions" de la tâche "([^"]+)"/,
  (commentaire, tache) => {
    // clique pour afficher le champ de saisie
    cy.get(
      `[data-test="task-${tache}"] button[data-test=btn-commentaire]`
    ).click();
    // puis saisi la valeur voulue
    cy.get(`[data-test="task-${tache}"] textarea`)
      .type('{selectall}{backspace}' + commentaire)
      .blur();
  }
);

When("aucun historique n'est affiché", () => {
  cy.get('[data-test^=action-statut-]').should('not.exist');
  cy.get('[data-test=empty_history]').should('be.visible');
});

When(/l'historique contient (\d+) entrées?/, (count) => {
  cy.get('[data-test=empty_history]').should('not.exist');
  cy.get('[data-test=Historique] [data-test=item]').should(
    'have.length',
    count
  );
});

When(
  /l'entrée (\d+) de l'historique est affichée avec les valeurs suivantes/,
  (num, dataTable) => {
    cy.get(`[data-test=Historique] [data-test=item]:nth(${num - 1})`)
      .should('exist')
      .within(() => {
        const lines = dataTable.raw();
        cy.wrap(lines).each((line) =>
          cy.get('[data-test=desc]').should('contain.text', line[0])
        );
      });
  }
);

When(/le détail de l'entrée (\d+) de l'historique n'est pas affiché/, (num) => {
  cy.get(
    `[data-test=Historique] [data-test=item]:nth(${
      num - 1
    }) [data-test=detail-on]`
  ).should('not.exist');
});

When(
  /le détail de l'entrée (\d+) est affiché avec les valeurs suivantes/,
  (num, dataTable) => {
    cy.get(
      `[data-test=Historique] [data-test=item]:nth(${
        num - 1
      }) [data-test=detail-on]`
    )
      .should('be.visible')
      .within(() => {
        const [precedente, courante] = dataTable.raw();
        if (precedente[1]) {
          cy.get('[data-test=prev]').should('contain.text', precedente[1]);
        } else {
          cy.get('[data-test=prev]').should('not.exist');
        }
        cy.get('[data-test=new]').should('contain.text', courante[1]);
      });
  }
);

When(
  /je clique sur le bouton "Afficher le détail" de l'entrée (\d+)/,
  (num) => {
    cy.get(
      `[data-test=Historique] [data-test=item]:nth(${
        num - 1
      }) [data-test=detail-off] button`
    ).click();
  }
);

When(/je clique sur le bouton "Masquer le détail" de l'entrée (\d+)/, (num) => {
  cy.get(
    `[data-test=Historique] [data-test=item]:nth(${
      num - 1
    }) [data-test=detail-on] button`
  ).click();
});

When(
  /je filtre l'historique avec le filtre "([^"]+)" par l'option "([^"]+)"/,
  (filtre, option) => {
    cy.get(`[data-test=filtre-${filtre}]`).click();
    cy.root()
      .get(`[data-test=filtre-${filtre}-options]`)
      .contains(option)
      .click();
    cy.get(`[data-test=filtre-${filtre}]`).click();
  }
);

When(/je filtre l'historique avec comme date de fin "([^"]+)"/, (date) => {
  cy.get('[data-test=filtre-end-date]').type(date);
});

When('je désactive tous les filtres', () => {
  cy.get('[data-test=desactiver-les-filtres]').click();
});
