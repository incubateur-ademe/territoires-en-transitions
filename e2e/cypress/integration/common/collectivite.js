/**
 * Génère une collectivité et diverses données de test (utilisateur, scores, etc.)
 */
import {Views, CollectivitePages} from './views';

// crée une collectivité de test
Given('une collectivité nommée {string}', createCollectivite);
function createCollectivite(nom) {
  cy.task('supabase_rpc', {
    name: 'test_create_collectivite',
    params: {nom},
  })
    .then(res => res.data)
    .as('collectivite');
}

// passe une collectivité en COT
Given('avec un COT actif', setCOT);
function setCOT() {
  cy.get('@collectivite').then(({collectivite_id}) =>
    cy.task('supabase_rpc', {
      name: 'test_set_cot',
      params: {collectivite_id, actif: true},
    })
  );
}

// crée un utilisateur de la coll. de test
Given('un utilisateur avec les droits en {string}', createUser);
function createUser(niveau) {
  cy.get('@collectivite').then(({collectivite_id}) =>
    cy
      .task('supabase_rpc', {
        name: 'test_add_random_user',
        params: {collectivite_id, niveau},
      })
      .then(res => res.data)
      .as(`user_${niveau}`)
  );
}

// connecte un utilisateur de la collectivité de test
Given('je suis connecté avec les droits en {string}', loginAs);
function loginAs(niveau) {
  cy.get(`@user_${niveau}`)
    .then(({email, password}) =>
      cy.get('@auth').then(auth => {
        auth.connect({email, password});
      })
    )
    .then(() => cy.get('[data-test=connectedMenu]').should('be.visible'));
}

// rend la collectivité de test labellisable au niveau voulu
Given("un score permettant d'obtenir la {int}ème étoile", fulfill);
Given("le score permet d'obtenir la {int}ème étoile", fulfill);
function fulfill(etoile) {
  cy.get('@collectivite').then(({collectivite_id}) =>
    cy.task('supabase_rpc', {
      name: 'test_fulfill',
      params: {collectivite_id, etoile},
    })
  );
}

// visite une page de la collectivité
Given('je suis sur la page {string} de la collectivité courante', visitPage);
function visitPage(page) {
  cy.get('@collectivite').then(({collectivite_id}) => {
    const {route, selector} = CollectivitePages[page];
    cy.visit(`/collectivite/${collectivite_id}/${route}`);
    cy.get(selector).should('be.visible');
  });
}
