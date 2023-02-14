/**
 * Génère une collectivité et diverses données de test (utilisateur, scores, etc.)
 */
import {Views, CollectivitePages} from './views';
import {waitForApp, logout} from './shared';

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

// passe cette collectivité en COT
Given('avec un COT actif', setCOT);
function setCOT() {
  const {collectivite_id} = this.collectivite;
  cy.task('supabase_rpc', {
    name: 'test_set_cot',
    params: {collectivite_id, actif: true},
  });
}

// crée un utilisateur de la collectivité
Given('un utilisateur avec les droits en {string}', addUserWithProfile);
function addUserWithProfile(niveau) {
  const {collectivite_id} = this.collectivite;
  addRandomUser(collectivite_id, niveau, `user_${niveau}`);
}

function addRandomUser(collectivite_id, niveau, alias) {
  return cy
    .task('supabase_rpc', {
      name: 'test_add_random_user',
      params: {collectivite_id, niveau},
    })
    .then(res => res.data)
    .as(alias);
}

// connecte un utilisateur de la collectivité de test
Given('je suis connecté avec les droits en {string}', loginWithProfile);
function loginWithProfile(niveau) {
  return loginAs(`@user_${niveau}`);
}
function loginAs(userAlias) {
  cy.get(userAlias).then(login);
  cy.get('[data-test=connectedMenu]').should('be.visible');
}
function login({email, password}) {
  this.auth.disconnect();
  this.auth.connect({email, password});
}

// ajoute un auditeur et le connecte
Given("je suis connecté en tant qu'auditeur de la collectivité", function () {
  addAuditeur.call(this);
  loginAs('@auditeur');
});
Given("je me reconnecte en tant qu'auditeur de la collectivité", function () {
  logout();
  waitForApp();
  addAuditeur.call(this);
  loginAs('@auditeur');
});
function addAuditeur() {
  const {collectivite_id} = this.collectivite;
  const {id: demande_id} = this.demande_envoyee;
  addRandomUser(collectivite_id, 'edition', 'auditeur').then(auditeur =>
    setAuditeur(demande_id, auditeur.user_id)
  );
}
function setAuditeur(demande_id, user_id) {
  return cy
    .task('supabase_rpc', {
      name: 'test_set_auditeur',
      params: {demande_id, user_id},
    })
    .then(({data}) => data)
    .as('audit_auditeur');
}

Given("l'audit est commencé", commencerAudit);
function commencerAudit() {
  cy.get('@audit_auditeur').then(({audit_id}) => {
    cy.task('supabase_rpc', {
      name: 'labellisation_commencer_audit',
      params: {audit_id},
    });
  });
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

// envoi une demande d'audit
Given(
  /je demande un audit de labellisation "(eci|cae)" pour la (1|2|3|4|5)è(?:r|m)e étoile/,
  envoyerDemande
);
Given(
  /avec un audit demandé pour la labellisation "(eci|cae)" (1|2|3|4|5)è(?:r|m)e étoile/,
  envoyerDemande
);
Given('avec un audit COT sans labellisation demandé', (referentiel) => envoyerDemande('cae', null, 'cot'));
function envoyerDemande(referentiel, etoile, sujet = 'labellisation') {
  return cy.get('@collectivite').then(function ({collectivite_id}) {
    return labellisationDemande(collectivite_id, referentiel).then(function () {
      return labellisationSubmitDemande(
        collectivite_id,
        referentiel,
        sujet,
        etoile
      );
    });
  });
}

function labellisationDemande(collectivite_id, referentiel) {
  return cy
    .task('supabase_rpc', {
      name: 'labellisation_demande',
      params: {collectivite_id, referentiel},
    })
    .then(({data}) => data);
}

function labellisationSubmitDemande(
  collectivite_id,
  referentiel,
  sujet,
  etoiles
) {
  return cy
    .task('supabase_rpc', {
      name: 'labellisation_submit_demande',
      params: {collectivite_id, referentiel, sujet, etoiles},
    })
    .then(({data}) => data)
    .as('demande_envoyee');
}

Given(
  /avec un audit en cours pour la labellisation "(eci|cae)" (1|2|3|4|5)è(?:r|m)e étoile/,
  function (referentiel, etoile) {
    envoyerDemande(referentiel, etoile).then(function () {
      addAuditeur.call(this);
      commencerAudit();
    });
  }
);

// visite une page de la collectivité
Given('je suis sur la page {string} de la collectivité courante', visitPage);
function visitPage(page) {
  cy.get('@collectivite').then(({collectivite_id}) => {
    const {route, selector} = CollectivitePages[page];
    cy.visit(`/collectivite/${collectivite_id}/${route}`);
    cy.get(selector).should('be.visible');
  });
}

When(
  /je visite l'onglet "([^"]*)" du référentiel "([^"]*)" de la collectivité courante/,
  function (tabName, referentiel) {
    const {collectivite_id} = this.collectivite;
    cy.visit(
      `/collectivite/${collectivite_id}/referentiels/${referentiel}/${tabName}`
    );
  }
);
