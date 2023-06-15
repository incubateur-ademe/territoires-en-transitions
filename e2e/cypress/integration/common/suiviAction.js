import {When} from '@badeball/cypress-cucumber-preprocessor';

When("je déplie la sous-action {string} du suivi de l'action", action =>
  getSousAction(action).within(() => {
    // clic pour déplier le panneau
    cy.root().click();
  })
);

When('je déplie le panneau Tâches de la sous-action {string}', action =>
  getTachesPanel(action).within(() => {
    // click pour déplier le panneau
    cy.root().click();
    // attend que la liste existe
    cy.get('[data-test^="task-"]').should('be.visible');
  })
);

const getSousAction = action => cy.get(`[data-test="SousAction-${action}"]`);

const getTachesPanel = action => cy.get(`[data-test="TâchesPanel-${action}"]`);
