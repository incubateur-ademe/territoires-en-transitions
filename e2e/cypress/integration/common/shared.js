// attends que l'appli expose un objet `e2e` permettant de la contrôler, il est
// nécessaire de rappeler cette fonction si on veut que la promesse
// `cy.get('@auth')` soit bien résolue une 2ème fois dans le même scénario
// (utilisée avec le step "je me reconnecte en tant que ...")
export function waitForApp() {
  cy.window({log: false}).its('e2e.history').as('history');
  cy.window({log: false}).its('e2e.auth').as('auth');
  cy.window({log: false}).its('e2e.supabaseClient').as('supabaseClient');
}

// déconnecte via l'ui
export function logout() {
  cy.get('[data-test=connectedMenu]').click();
  cy.get('[data-test=logoutBtn]').click();
}
