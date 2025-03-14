// attends que l'appli expose un objet `e2e` permettant de la contrôler, il est
// nécessaire de rappeler cette fonction si on veut que la promesse
// `cy.get('@auth')` soit bien résolue une 2ème fois dans le même scénario
// (utilisée avec le step "je me reconnecte en tant que ...")
export function waitForApp() {
  cy.window({ log: false }).its('e2e.router').as('router', { type: 'static' });
  cy.window({ log: false })
    .its('e2e.supabase')
    .as('supabase', { type: 'static' });
}

// déconnecte via l'ui
export function logout() {
  cy.get('.fr-header__tools-links [data-test=nav-user]').click();
  cy.get('[data-test=user-logout]').click();
}

// clic en-dehors d'une boîte de dialogue
export function clickOutside() {
  cy.get('[data-floating-ui-portal] div').first().click(1, 1);
}
