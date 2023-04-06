/**
 * Génère une collectivité et diverses données de test (utilisateur, scores, etc.)
 */
import {defineStep} from '@badeball/cypress-cucumber-preprocessor';
import {Views, CollectivitePages} from './views';
import {waitForApp, logout} from './shared';

// crée une collectivité de test
defineStep('une collectivité nommée {string}', createCollectivite);
function createCollectivite(nom) {
  cy.task('supabase_rpc', {
    name: 'test_create_collectivite',
    params: {nom},
  })
    .then(res => res.data)
    .as('collectivite');
}

// passe cette collectivité en COT
defineStep('avec un COT actif', setCOT);
function setCOT() {
  const {collectivite_id} = this.collectivite;
  cy.task('supabase_rpc', {
    name: 'test_set_cot',
    params: {collectivite_id, actif: true},
  });
}

// crée un utilisateur de la collectivité
defineStep('un utilisateur avec les droits en {string}', addUserWithProfile);
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
defineStep('je suis connecté avec les droits en {string}', loginWithProfile);
function loginWithProfile(niveau) {
  return loginAs.call(this, `@user_${niveau}`);
}
function loginAs(userAlias) {
  cy.get(userAlias).then(function (user) {
    login.call(this, user);
    cy.get('[data-test=connectedMenu]').should('contain.text', user.prenom);
  });
}
function login({email, password}) {
  cy.get('@auth').then(auth => {
    auth.disconnect();
    auth.connect({email, password});
  });
}

// ajoute un auditeur et le connecte
defineStep(
  "je suis connecté en tant qu'auditeur de la collectivité",
  function () {
    addAuditeur.call(this);
    loginAs.call(this, '@auditeur');
  }
);
defineStep(
  "je me reconnecte en tant qu'auditeur de la collectivité",
  function () {
    logout();
    waitForApp();
    addAuditeur.call(this);
    loginAs.call(this, '@auditeur');
  }
);
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

defineStep("l'audit est commencé", commencerAudit);
function commencerAudit() {
  cy.get('@audit_auditeur').then(({audit_id}) => {
    cy.task('supabase_rpc', {
      name: 'labellisation_commencer_audit',
      params: {audit_id},
    });
  });
}

// rend la collectivité de test labellisable au niveau voulu
defineStep("un score permettant d'obtenir la {int}ème étoile", fulfill);
defineStep("le score permet d'obtenir la {int}ème étoile", fulfill);
defineStep("le score permet d'obtenir la {int}ère étoile", fulfill);
function fulfill(etoile) {
  cy.get('@collectivite').then(({collectivite_id}) =>
    cy.task('supabase_rpc', {
      name: 'test_fulfill',
      params: {collectivite_id, etoile},
    })
  );
}

// envoi une demande d'audit
defineStep(
  /je demande un audit de labellisation "(eci|cae)" pour la (1|2|3|4|5)è(?:r|m)e étoile/,
  envoyerDemande
);
defineStep(
  /avec un audit demandé pour la labellisation "(eci|cae)" (1|2|3|4|5)è(?:r|m)e étoile/,
  envoyerDemande
);
defineStep('avec un audit COT sans labellisation demandé', referentiel =>
  envoyerDemande('cae', null, 'cot')
);
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

defineStep(
  /avec un audit en cours pour la labellisation "(eci|cae)" (1|2|3|4|5)è(?:r|m)e étoile/,
  function (referentiel, etoile) {
    envoyerDemande(referentiel, etoile).then(function () {
      addAuditeur.call(this);
      commencerAudit();
    });
  }
);

// visite une page de la collectivité
defineStep(
  'je suis sur la page {string} de la collectivité courante',
  visitPage
);
defineStep(
  'je retourne sur la page {string} de la collectivité courante',
  visitPage
);
function visitPage(page) {
  cy.get('@collectivite').then(({collectivite_id}) => {
    const {route, selector} = CollectivitePages[page];
    cy.visit(`/collectivite/${collectivite_id}/${route}`);
    cy.get(selector).should('be.visible');
  });
}

defineStep(
  /je visite l'onglet "([^"]*)" du référentiel "([^"]*)" de la collectivité courante/,
  function (tabName, referentiel) {
    const {collectivite_id} = this.collectivite;
    cy.visit(
      `/collectivite/${collectivite_id}/referentiels/${referentiel}/${tabName}`
    );
  }
);

defineStep(
  "je visite l'action {string} de la collectivité courante",
  function (action) {
    cy.get('@collectivite').then(({collectivite_id}) => {
      const [referentiel, identifiant] = action.split('_');
      cy.visit(
        `/collectivite/${collectivite_id}/action/${referentiel}/${action}`
      );
      cy.get(`[data-test="Action-${identifiant}"]`).should('be.visible');
    });
  }
);

defineStep('avec comme réponses initiales :', function (dataTable) {
  const {collectivite_id} = this.collectivite;

  cy.wrap(dataTable.rows()).each(([question_id, reponse]) =>
    saveReponse(collectivite_id, question_id, reponse)
  );
});
const saveReponse = (collectivite_id, question_id, reponse) => {
  cy.task('supabase_rpc', {
    name: 'save_reponse',
    params: {
      collectivite_id,
      question_id,
      reponse: transformReponse(reponse),
    },
  });
};

const transformReponse = reponse => {
  if (reponse.toLowerCase() === 'oui') {
    return true;
  }
  if (reponse.toLowerCase() === 'non') {
    return false;
  }
  return reponse;
};

defineStep(
  'je change la réponse à la question {string} depuis la thématique {string} en {string}',
  function (question_id, thematique, reponse) {
    const {collectivite_id} = this.collectivite;
    cy.visit(`/collectivite/${collectivite_id}/personnalisation/${thematique}`);
    cy.get(`label[for^=${question_id}] button`).click();
    cy.get(`input[id=${question_id}-${reponse}]`).parent().click();
  }
);
