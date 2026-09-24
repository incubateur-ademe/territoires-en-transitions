import { describe, it } from 'vitest';

describe('full-flow', () => {
  it.todo(
    'relit toutes les fiches des CT demandées sans tenir compte du dernier passage'
  );
  it.todo('classe par lots de 25 les fiches que le plan désigne');
  it.todo(
    "écrit les volets puis le statut traité et l'empreinte de chaque fiche classée"
  );
});

describe('enjeu', () => {
  it.todo(
    "classe les fiches, écrit les volets et calcule l'engagement pour l'enjeu reçu en entrée"
  );
});

describe('fiche-sans-volet', () => {
  it.todo('écrit un statut traité pour une fiche classée sans volet');
});

describe('daily-ct-check', () => {
  it.todo(
    'lit les fiches en attente depuis le début du dernier passage quotidien terminé'
  );
  it.todo(
    "lit toutes les fiches quand aucun passage quotidien n'a encore été enregistré"
  );
  it.todo(
    "vérifie l'engagement de toutes les CT qui ont au moins un statut, même hors du périmètre du passage"
  );
  it.todo("vérifie l'engagement des CT qui n'ont plus aucun statut");
  it.todo(
    "traite comme jamais calculé l'engagement d'une CT qui a des statuts mais pas d'engagement"
  );
  it.todo(
    "recalcule l'engagement des CT périmées avec les volets et le texte de leurs fiches classées"
  );
  it.todo(
    "remplace l'engagement de la CT par celui que ScoreMobilisationService vient de calculer"
  );
  it.todo("ne recalcule pas l'engagement d'une CT à jour");
  it.todo('enregistre le passage quotidien avec sa date de début');
  it.todo("n'enregistre pas de passage quotidien pour un lancement sur des CT");
});

describe('cron-action-management', () => {
  it.todo(
    'marque périmées, compteur à 0, les fiches désignées par le plan avant de les classer'
  );
});

describe('retry-on-failure', () => {
  it.todo(
    "relance jusqu'à 3 fois dans le passage les seules fiches encore en échec"
  );
  it.todo(
    "relance sans leur compter d'essai raté les autres fiches d'un lot dont une fiche est fautive"
  );
  it.todo(
    'écrit en erreur, compteur incrémenté et empreinte inchangée, une fiche qui échoue 3 fois'
  );
  it.todo(
    "relance jusqu'à 3 fois le calcul d'engagement d'une CT avant de la compter en échec"
  );
});

describe('reclassification-on-deletion', () => {
  it.todo('supprime les volets et le statut des fiches supprimées');
  it.todo('ne reclasse aucune autre fiche de la CT');
});

describe('full-flow-behavior-on-already-processed-action', () => {
  it.todo(
    "n'appelle pas le LLM pour une CT dont toutes les fiches sont traitées et inchangées"
  );
});

describe('llm-issue', () => {
  it.todo(
    'abandonne le passage au 10e échec définitif, fiches et CT confondues'
  );
  it.todo("n'enregistre pas un passage abandonné");
  it.todo("garde les statuts déjà écrits avant l'abandon");
});
