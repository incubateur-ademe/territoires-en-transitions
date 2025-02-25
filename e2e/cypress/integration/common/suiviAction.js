import { When } from '@badeball/cypress-cucumber-preprocessor';

When("je déplie la sous-action {string} du suivi de l'action", (action) => {
  // clic pour déplier le panneau
  cy.get(`[data-test="SousAction-${action}"]`).click();
});

When('je déplie le panneau Tâches de la sous-action {string}', (action) =>
  getTachesPanel(action).within(($action) => {
    // On vérifie si le panneau est déjà déplié
    if ($action.has('[data-test^="task-"]')) {
      // Si oui, on ne fait rien
      cy.get('[data-test^="task-"]').should('be.visible');
      return;
    }

    // click pour déplier le panneau
    cy.root().click();
    // attend que la liste existe
    cy.get('[data-test^="task-"]').should('be.visible');
  })
);

const getTachesPanel = (action) =>
  cy.get(`[data-test="TâchesPanel-${action}"]`);
