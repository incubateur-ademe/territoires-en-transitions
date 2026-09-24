import { describe, it } from 'vitest';

describe('daily-ct-check', () => {
  it.todo(
    "renvoie l'engagement d'une CT calculé à partir de ses volets et du texte de ses fiches, sans job d'analyse"
  );
  it.todo("renvoie un engagement vide pour une CT qui n'a plus aucun volet");
  it.todo("n'écrit pas l'engagement calculé");
  it.todo("renvoie leviers_not_scored quand un levier n'a pas pu être noté");
  it.todo('renvoie collectivite_not_found pour une CT introuvable');
});
