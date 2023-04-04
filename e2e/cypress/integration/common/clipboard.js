const {defineStep} = require('@badeball/cypress-cucumber-preprocessor');

defineStep(/le presse-papier contient "([^"]*)"/, message => {
  cy.task('getClipboard').should('contain', message);
});

defineStep('je visite le lien copié', () =>
  cy.task('getClipboard').then(val => {
    cy.visit({
      url: val,
    });
  })
);
