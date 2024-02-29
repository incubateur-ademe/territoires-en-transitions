import {When} from '@badeball/cypress-cucumber-preprocessor';

When("je déplie la sous-action {string} du suivi de l'action", action => {
  // clic pour déplier le panneau
  cy.get(`[data-test="SousAction-${action}"]`).click(
    // la zone cliquable pour déplier est en haut du composant
    10,
    10,
    // fait en sorte que le composant ne soit pas masqué par l'en-tête avant de cliquer
    {scrollBehavior: 'bottom'}
  );
});

When('je déplie le panneau Tâches de la sous-action {string}', action =>
  getTachesPanel(action).within(() => {
    // click pour déplier le panneau
    cy.root().click();
    // attend que la liste existe
    cy.get('[data-test^="task-"]').should('be.visible');
  })
);

const getTachesPanel = action => cy.get(`[data-test="TâchesPanel-${action}"]`);
