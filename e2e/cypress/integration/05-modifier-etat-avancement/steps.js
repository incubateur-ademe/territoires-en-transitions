/// <reference types="Cypress" />

When(
  /l'état d'avancement de l'action "([^"]+)" pour la collectivité "(\d+)" est réinitialisé/,
  (action_id, collectivite_id) => {
    // on utilise ici un reset "hard" directement dans la base en attendant de
    // disposer d'un appel RPC pour le faire de manière un peu plus "propre"
    // (Ref: https://github.com/betagouv/territoires-en-transitions/issues/1572)
    cy.task('pg_query', {
      query:
        'DELETE FROM action_statut WHERE collectivite_id = $1 AND action_id LIKE $2',
      values: [collectivite_id, action_id],
    });
  }
);

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
    cy.get(`[data-test="score-${action}"]`).should('have.text', score);
  });
});

When(
  /j'assigne la valeur "([^"]+)" à l'état d'avancement de la tâche "([^"]+)"/,
  (avancement, tache) => {
    // ouvre le composant Select
    cy.get(`[data-test="task-${tache}"]`).click();
    // et sélectionne l'option voulue
    cy.get(
      `.MuiPopover-root [role=option][data-value=${avancementToValue[avancement]}]`
    ).click();
  }
);

const avancementToValue = {
  'Non renseigné': -1,
  Fait: 1,
  Programmé: 2,
  'Pas fait': 3,
  Détaillé: 4,
  'Non concerné': 5,
};

When(
  /je saisi "([^"]+)" dans le champ "Précisions" de la tâche "([^"]+)"/,
  (commentaire, tache) => {
    cy.get(`[data-test="comm-${tache}"] textarea`)
      .clear()
      .type(commentaire)
      .blur();
  }
);

When(/je clique sur l'onglet "([^"]+)"/, (tabName) => {
  cy.get('.fr-tabs__tab').contains(tabName).click();
});

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

When(/l'historique est réinitialisé/, () => {
  cy.task('pg_query', {
    query: 'TRUNCATE action_commentaire',
  });
  cy.task('supabase_rpc', { name: 'test_clear_history' });
});
