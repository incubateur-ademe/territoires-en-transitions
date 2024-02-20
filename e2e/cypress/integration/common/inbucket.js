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

When('la mailbox de {string} est vidée', nom => {
  purgeMailbox(nom);
});

When('la mailbox de {string} contient {int} message(s)', (name, count) => {
  mailbox(name).then(inbox => cy.wrap(inbox.length).should('eq', count));
});

When(
  'le dernier message dans la mailbox de {string} contient le texte {string}',
  (name, text) => {
    mailbox(name)
      .then(inbox => inbox[inbox.length - 1].id)
      .then(messageId => message(name, messageId))
      .then(message => cy.wrap(message.body.text).should('include', text));
  }
);

When(
  'je visite le lien contenu dans le dernier message de la maibox de {string}',
  name => {
    mailbox(name)
      .then(inbox => inbox[inbox.length - 1].id)
      .then(messageId => message(name, messageId))
      .then(message => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(message.body.html, 'text/html');
        const a = doc.getElementsByTagName('a').item(0);
        const href = a.getAttribute('href');
        cy.visit(href);
      });
  }
);
