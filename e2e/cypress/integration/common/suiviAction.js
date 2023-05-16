import {defineStep} from '@badeball/cypress-cucumber-preprocessor';

defineStep("je déplie la sous-action {string} du suivi de l'action", action =>
  getSousAction(action).within(() => {
    // clic pour déplier le panneau
    cy.root().click();
  })
);

defineStep('je déplie le panneau Tâches de la sous-action {string}', action =>
  getTachesPanel(action).within(() => {
    // click pour déplier le panneau
    cy.root().click();
    // attend que la liste existe
    cy.get('[data-test^="task-"]').should('be.visible');
  })
);

const getSousAction = action => cy.get(`[data-test="SousAction-${action}"]`);

const getTachesPanel = action => cy.get(`[data-test="TâchesPanel-${action}"]`);
