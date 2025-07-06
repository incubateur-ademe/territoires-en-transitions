const {When} = require('@badeball/cypress-cucumber-preprocessor');

When(/le presse-papier contient "([^"]*)"/, message => {
  cy.task('getClipboard').should('contain', message);
});

When('je visite le lien copié', () =>
  cy.task('getClipboard').then(val => {
    cy.visit({
      url: val,
    });
  })
);
