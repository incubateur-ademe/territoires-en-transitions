import { describe, it } from 'vitest';

describe('full-flow', () => {
  it.todo(
    'à la fin du script, chaque fiche des CT demandées a un statut traité et ses volets dans fiche_action_volet_ges'
  );
  it.todo('analyse les fiches hors plan et restreintes, pas les sous-fiches');
});

describe('fiche-sans-volet', () => {
  it.todo(
    'une fiche classée sans volet a un statut traité et aucune ligne dans fiche_action_volet_ges'
  );
});

describe('daily-ct-check', () => {
  it.todo(
    "le passage quotidien classe les fiches créées depuis le dernier passage et recalcule l'engagement de leur CT"
  );
});

describe('cron-action-management', () => {
  it.todo(
    'une fiche dont la description a changé depuis le dernier passage est reclassée'
  );
});

describe('retry-on-failure', () => {
  it.todo(
    'une fiche que le LLM rejette 3 fois est en erreur avec un compteur à 1, puis reclassée au passage suivant'
  );
});

describe('reclassification-on-deletion', () => {
  it.todo(
    "une fiche supprimée en douce perd ses volets et son statut, et sort de l'engagement de sa CT"
  );
  it.todo(
    "une fiche supprimée physiquement sort de l'engagement de sa CT au passage suivant"
  );
  it.todo(
    "l'engagement d'une CT dont la dernière fiche analysée est supprimée est vidé au passage suivant"
  );
});

describe('full-flow-behavior-on-already-processed-action', () => {
  it.todo(
    'relancer le script sur une CT déjà analysée sans changement ne rappelle pas le LLM'
  );
});

describe('only-github-action', () => {
  it.todo("le router analysis n'expose plus que getMobilisation");
  it.todo(
    "aucune procédure tRPC ne déclenche l'analyse, quel que soit le rôle"
  );
});

describe('llm-issue', () => {
  it.todo(
    'le script sort avec un code non nul quand 10 fiches échouent définitivement'
  );
});

describe('wiring', () => {
  it.todo('AnalyzeFichesModule démarre en contexte applicatif sans BullMQ');
  it.todo(
    'le workflow analyze-fiches.yml lance le script chaque jour et à la demande avec une liste de CT ou all'
  );
});
