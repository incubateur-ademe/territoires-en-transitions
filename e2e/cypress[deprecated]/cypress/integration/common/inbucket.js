/**
 * Test des mailboxes virtuelles fournies par inbucket
 */
import {When} from '@badeball/cypress-cucumber-preprocessor';

const INBUCKET_URL = 'http://localhost:54324';
const INBUCKET_API = `${INBUCKET_URL}/api/v1`;

const handleResponse = response => response.body;
const purgeMailbox = name =>
  cy.request('DELETE', `${INBUCKET_API}/mailbox/${name}`);
const mailbox = name =>
  cy.request(`${INBUCKET_API}/mailbox/${name}`).then(handleResponse);
const message = (name, id) =>
  cy.request(`${INBUCKET_API}/mailbox/${name}/${id}`).then(handleResponse);

const MAX_RETRIES = 4;
const RETRY_BASE_DELAY_MS = 1000; // attends num_essai * ce délai entre chaque essai

// récupère le dernier message d'une mailbox (ré-essaye plusieurs fois en cas d'échec)
const getLastMessage = (name, retry = 0) => {
  return mailbox(name).then((inbox) => {
    if (inbox.length >= 1) {
      const messageId = inbox[inbox.length - 1].id;
      return message(name, messageId);
    }
    if (inbox.length < 1 && retry < MAX_RETRIES) {
      const r = retry + 1;
      const delay = r * RETRY_BASE_DELAY_MS;
      cy.log(`retry ${r}/${MAX_RETRIES} getLastMessage into ${delay}ms`);
      cy.wait(delay);
      return getLastMessage(name, r);
    }
    assert(
      inbox.length >= 1,
      `la mailbox de ${name} contient au moins 1 message`
    );
  });
};

// vérifie le nombre de messages d'une mailbox et ré-essaye plusieurs fois d'obtenir le résultat attendu
const assertMessageCount = (name, count, retry = 0) => {
  return mailbox(name).then((inbox) => {
    if (inbox.length < count && retry < MAX_RETRIES) {
      const r = retry + 1;
      const delay = r * RETRY_BASE_DELAY_MS;
      cy.log(`retry ${r}/${MAX_RETRIES} assertMessageCount into ${delay}ms`);
      cy.wait(delay);
      assertMessageCount(name, count, r);
    } else {
      assert(
        inbox.length >= count,
        `la mailbox de ${name} contient ${count} message(s)`
      );
    }
  });
};

const getOTPFromMessage = (message) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(message.body.html, 'text/html');
  return doc.getElementById('otp').textContent;
};

When('la mailbox de {string} est vidée', (nom) => {
  purgeMailbox(nom);
});

When('la mailbox de {string} contient {int} message(s)', (name, count) =>
  assertMessageCount(name, count)
);

When(
  'le dernier message dans la mailbox de {string} contient le texte {string}',
  (name, text) => {
    getLastMessage(name).then((message) =>
      cy.wrap(message.body.text).should('include', text)
    );
  }
);

When(
  'je visite le lien contenu dans le dernier message de la mailbox de {string}',
  (name) => {
    getLastMessage(name).then((message) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(message.body.html, 'text/html');
      const a = doc.getElementsByTagName('a').item(0);
      const href = a.getAttribute('href');
      cy.visit(href);
    });
  }
);

When(
  'je saisi le code OTP du dernier message de la mailbox de {string}',
  function (name, elem) {
    getLastMessage(name).then((message) => {
      const otp = getOTPFromMessage(message);
      cy.get('[name=otp]').type(otp);
    });
  }
);

When(
  'le champ de saisie du code est pré-rempli avec celui reçu dans la mailbox de {string}',
  function (name, elem) {
    getLastMessage(name).then((message) => {
      const otp = getOTPFromMessage(message);
      // la valeur affichée dans le champ est formatée avec des espaces entre chaque chiffre
      const formatted = otp.split('').join(' ');
      cy.get('[name=otp]').should('have.value', formatted);
    });
  }
);
