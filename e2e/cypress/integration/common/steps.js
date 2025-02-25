/**
 * Définitions de "steps" communes à tous les tests
 */

import { When } from '@badeball/cypress-cucumber-preprocessor';
import { Expectations } from './expectations';
import { Selectors } from './selectors';
import { clickOutside, logout, waitForApp } from './shared';

function testReset(retry = 0) {
  // réinitialise les données fake
  cy.task('supabase_rpc', { name: 'test_reset' }).then((ret) => {
    if (ret.status !== 200 && retry < 3) {
      // attends un peu et ré-essaye si ça a échoué
      cy.wait(100);
      testReset(++retry);
    } else {
      assert(
        ret.status === 200,
        'les données de test sont réinitialisées correctement'
      );
    }
  });
}

// avant chaque test
beforeEach(function () {
  // réinitialise les données fake
  testReset();

  // charge l'appli
  cy.visit('/');
  waitForApp();

  // bouchon pour la fonction window.open
  const stub = cy.stub().as('open');
  cy.on('window:before:load', (win) => {
    cy.stub(win, 'open').callsFake(stub);
  });
});

When("j'ouvre le site", () => {
  cy.get('[data-test=home]').should('be.visible');
});

const genUser = (userName) => {
  const letter = userName.slice(1, userName.indexOf('l'));
  const dd = `d${letter}d${letter}`;
  return {
    email: `${userName}@${dd}.com`,
    password: `${userName}${dd}`,
  };
};

const SignInPage = Selectors['formulaire de connexion'];
When(/je suis connecté en tant que "([^"]*)"/, login);

function login(userName) {
  const u = genUser(userName);
  cy.get('@supabase').then(
    async (supabase) => await supabase.auth.signInWithPassword(u)
  );
  cy.reload();
  cy.get(SignInPage.selector).should('not.exist');
  cy.get('[data-test=nav-user]').should('be.visible');
}

When(
  "je suis connecté en tant qu'utilisateur de la collectivité {int} n'ayant pas encore accepté les CGU",
  function (collectivite_id) {
    return cy
      .task('supabase_rpc', {
        name: 'test_add_random_user',
        params: { collectivite_id, niveau: 'edition', cgu_acceptees: false },
      })
      .then(({ data: user }) => {
        cy.get('@supabase').then(
          async (supabase) => await supabase.auth.signInWithPassword(user)
        );
        cy.reload();
        cy.get(SignInPage.selector).should('not.exist');
        cy.get('[data-test=nav-user]').should('be.visible');
      });
  }
);

When('les discussions sont réinitialisées', () => {
  cy.task('supabase_rpc', { name: 'test_reset_discussion_et_commentaires' });
});

When('les droits utilisateur sont réinitialisés', () => {
  cy.task('supabase_rpc', { name: 'test_reset_droits' });
});

When(/l'utilisateur "([^"]*)" est supprimé/, (email) => {
  cy.task('supabase_rpc', {
    name: 'test_remove_user',
    params: { email: email },
  });
});

When('les informations des membres sont réinitialisées', () => {
  cy.task('supabase_rpc', { name: 'test_reset_membres' });
});

When('je me déconnecte', logout);

// Met en pause le déroulement d'un scénario.
// Associé avec le tag @focus cela permet de debugger facilement les tests.
When('pause', () => cy.pause());

// utilitaire pour vérifier quelques attentes d'affichage génériques à partir d'une table de correspondances
export const checkExpectation = (selector, expectation, value) => {
  const c = Expectations[expectation];
  if (!c) return;
  if (typeof c === 'object' && c.cond) {
    cy.get(selector).should(c.cond, value || c.value);
  } else if (typeof c === 'function') {
    c(selector, value);
  } else {
    if (selector) {
      cy.get(selector).should(c, value);
    } else {
      cy.root().should(c, value);
    }
  }
};

// renvoi le sélecteur local (ou à défaut le sélecteur global) correspondant à
// un nom d'élément dans la page
export const resolveSelector = (context, elem) => {
  const s = context.LocalSelectors?.[elem] || Selectors[elem];
  assert(s, `le sélecteur "${elem}" est défini`);
  return s;
};

// on utilise "function" (plutôt qu'une arrow function) pour que "this" donne
// accès au contexte de manière synchrone
// Ref: https://docs.cypress.io/guides/core-concepts/variables-and-aliases#Sharing-Context
When(/la page vérifie les conditions suivantes/, function (dataTable) {
  const rows = dataTable.rows();
  cy.wrap(rows).each(function ([elem, expectation, value]) {
    checkExpectation(resolveSelector(this, elem).selector, expectation, value);
  });
});
When(
  /le "([^"]*)" vérifie les conditions suivantes/,
  function (parentName, dataTable) {
    const parent = resolveSelector(this, parentName);
    cy.get(parent.selector).within(function () {
      const rows = dataTable.rows();
      cy.wrap(rows).each(function ([elem, expectation, value]) {
        checkExpectation(parent.children[elem], expectation, value);
      });
    });
  }
);
When(/le "([^"]*)" vérifie la condition "([^"]*)"/, verifyExpectation);
When(/^le "([^"]*)" est ([^"]*)$/, verifyExpectation);
When(/"([^"]*)" contient "([^"]*)"$/, function (elem, value) {
  checkExpectation(resolveSelector(this, elem).selector, 'contient', value);
});
When(/^la case "([^"]*)" est ([^"]*)$/, verifyExpectation);
When('le bouton {string} est {word}', verifyExpectation);
When(
  'le bouton {string} est {word} et {word}',
  function (elem, expectation1, expectation2) {
    checkExpectation(resolveSelector(this, elem).selector, expectation1);
    checkExpectation(resolveSelector(this, elem).selector, expectation2);
  }
);
When(
  /^le bouton "([^"]*)" du "([^"]*)" est ([^"]*)$/,
  childrenVerifyExpectation
);

function verifyExpectation(elem, expectation) {
  checkExpectation(resolveSelector(this, elem).selector, expectation);
}
function childrenVerifyExpectation(elem, parentName, expectation) {
  const parent = resolveSelector(this, parentName);
  checkExpectation(`${parent.selector} ${parent.children[elem]}`, expectation);
}

function handleClickOnElement(subElement, elem) {
  const parent = resolveSelector(this, elem);
  cy.get(parent.selector).find(parent.children[subElement]).click();
}
When(
  /je clique sur le bouton "([^"]*)" (?:du|de la) "([^"]*)"/,
  handleClickOnElement
);
When(/je clique sur l'onglet "([^"]*)" du "([^"]*)"/, handleClickOnElement);
When(
  /je clique sur le bouton "([^"]*)" de la page "([^"]*)"/,
  handleClickOnElement
);
When(/^je clique sur le bouton "([^"]*)"$/, function (btnName) {
  cy.get(resolveSelector(this, btnName).selector).click();
});
When(/^je clique sur le bouton invisible "([^"]*)"$/, function (btnName) {
  cy.get(resolveSelector(this, btnName).selector).click({ force: true });
});
When(/^je clique sur le bouton radio "([^"]*)"$/, function (btnName) {
  // le bouton radio natif est masqué par la version stylé alors on clique sur le libellé qui le suit immédiatement
  cy.get(resolveSelector(this, btnName).selector + '+label').click();
});

When(/^je clique sur la case "([^"]*)"$/, function (checkbox) {
  cy.get(resolveSelector(this, checkbox).selector)
    .parent()
    .should('have.class', 'fr-checkbox-group')
    .click();
});

When('je coche la case {string}', function (checkbox) {
  cy.get(resolveSelector(this, checkbox).selector).within(() => {
    cy.root().should('not.be.checked');
    cy.root().click();
    cy.root().should('be.checked');
  });
});

When('je décoche la case {string}', function (checkbox) {
  cy.get(resolveSelector(this, checkbox).selector).within(() => {
    cy.root().should('be.checked');
    cy.root().click();
    cy.root().should('not.be.checked');
  });
});

function fillFormWithValues(elem, dataTable) {
  const parent = resolveSelector(this, elem);
  cy.get(parent.selector).within(() => {
    const rows = dataTable.rows();
    cy.wrap(rows).each(([field, value]) => {
      cy.get(parent.children[field]).type('{selectall}{backspace}' + value);
    });
  });
}
When(/je remplis le "([^"]*)" avec les valeurs suivantes/, fillFormWithValues);

When(/l'appel à "([^"]*)" va répondre "([^"]*)"/, function (name, reply) {
  const r = this.LocalMocks?.[name]?.[reply];
  assert(r, 'mock non trouvé');
  cy.intercept(...r).as(name);
});

When(
  "je sélectionne l'option {string} dans la liste déroulante {string}",
  selectDropdownValue
);
When(
  "je sélectionne l'option {string} dans la liste déroulante {string} du {string}",
  selectDropdownValue
);
function selectDropdownValue(value, dropdown, parentElem) {
  // ouvre le sélecteur
  if (parentElem) {
    const parent = resolveSelector(this, parentElem);
    cy.get(parent.selector).find(parent.children[dropdown]).click();
  } else {
    cy.get(resolveSelector(this, dropdown).selector).click();
  }
  // et sélectionne la valeur voulue
  cy.get(`[data-test="${value}"]`).should('be.visible').click();
}

When('je saisi la valeur {string} dans le champ {string}', fillInput);
function fillInput(value, input) {
  cy.get(resolveSelector(this, input).selector).type(
    '{selectall}{backspace}' + value
  );
}

When('je clique en dehors de la boîte de dialogue', clickOutside);

When('je valide le formulaire', () => cy.get('button[data-test=ok]').click());

const transateTypes = {
  succès: 'success',
  information: 'info',
  erreur: 'error',
};

When(
  'une notification de type {string} est affichée et contient {string}',
  (type, message) => {
    cy.get(`[data-test=toast-${transateTypes[type]}]`)
      .should('be.visible')
      .should('contain.text', message);
  }
);

When('je recharge la page', () => {
  cy.reload();
});

// Le tableau des membres est utilisé dans plusieurs tests
// pour valider la modification des informations des membres ou
// les informations de l'utilisateur courant
const tableauMembresSelector = Selectors['tableau des membres'];
When(
  'le tableau des membres doit contenir les informations suivantes',
  (dataTable) => {
    cy.get(tableauMembresSelector.selector).within(() => {
      // Attend la disparition du chargement.
      cy.get('[data-test=Loading]').should('not.exist');
      cy.wrap(dataTable.rows()).each(
        (
          [nom, mail, fonction, champ_intervention, details_fonction, acces],
          index
        ) => {
          cy.contains(nom).should('be.visible');
          cy.contains(mail).should('be.visible');
          cy.contains(acces).should('be.visible');

          if (details_fonction.length > 0) {
            cy.contains(details_fonction).should('be.visible');
          }
          if (champ_intervention.length > 0) {
            cy.contains(champ_intervention).should('be.visible');
          }
          if (fonction.length > 0) {
            cy.contains(fonction).should('be.visible');
          }

          // cy.get(`tbody tr:nth(${index})`).within(() => {
          //   cy.get('td:first').should('contain.text', nom);
          //   cy.get('td:first').should('contain.text', mail);
          //   // cy.get('td:nth(1)').should('contain.text', telephone);
          //   cy.get('td:nth(1)').should('contain.text', fonction);
          //   cy.get('td:nth(2)').should('contain.text', champ_intervention);
          //   cy.get('td:nth(3)').should('contain.text', details_fonction);
          //   cy.get('td:nth(4)').should('contain.text', acces);
          // });
        }
      );
    });
  }
);

When(/je clique sur l'onglet "([^"]+)"$/, (tabName) => {
  cy.get('ul[role=tablist]').contains(tabName).click();
});

When(/je vois (\d+) onglets?/, (count) =>
  cy.get('ul[role=tablist]').should('have.length', count)
);
When('je ne vois aucun onglet', () =>
  cy.get('ul[role=tablist]').should('have.length', 0)
);

When(/l'onglet "([^"]+)" est sélectionné/, (tabName) =>
  cy
    .get('ul[role=tablist]')
    .contains(tabName)
    .should('have.attr', 'aria-selected', 'true')
);

When('le badge {string} est visible', (text) => {
  cy.get('[data-test=Badge-a-completer]')
    .contains(text)
    .scrollIntoView()
    .should('be.visible');
});
When('le badge {string} est absent', (text) => {
  cy.get('[data-test=Badge-a-completer]').contains(text).should('not.exist');
});

When(/le texte "([^"]*)" est visible/, (texte) => {
  cy.contains(texte).should('be.visible');
});
When(/le texte "([^"]*)" est absent/, (texte) => {
  cy.contains(texte).should('not.exist');
});

When(
  /je crée un tag "([^"]*)" avec le sélecteur de tag "([^"]*)"/,
  (tag, selecteur) => {
    // on utilise `force: true` parce que le `input` du `Select` est à l'intérieur d'un `button`
    cy.get(`[data-test=${selecteur}-input]`).type(
      '{selectall}{backspace}' + tag,
      { force: true }
    );
    cy.get(`[data-test=${selecteur}-creer-tag]`).click({ force: true });
    cy.get(`[data-test=${selecteur}-options]`)
      .contains(tag)
      .should('be.visible');
  }
);
