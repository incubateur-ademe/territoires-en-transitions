import { describe, it } from 'vitest';

describe('list-actions', () => {
  it.todo('renvoie les actions filtrées à un utilisateur connecté sans rôle');
  it.todo('refuse un appel sans utilisateur connecté');
  it.todo('refuse en BAD_REQUEST un levier ou une catégorie hors liste');
  it.todo(
    "ne filtre pas sur le titre ni sur la description quand le texte cherché n'est fait que d'espaces"
  );
  it.todo(
    'renvoie toutes les actions quand les listes de leviers et de catégories envoyées sont vides'
  );
});

describe('update-action', () => {
  it.todo(
    "modifie l'action pour un super admin et renvoie son id, la valeur en base suit les champs envoyés"
  );
  it.todo("refuse en FORBIDDEN un utilisateur qui n'est pas super admin");
  it.todo("ne modifie pas l'action quand l'utilisateur n'est pas super admin");
  it.todo('refuse en NOT_FOUND un id inconnu');
  it.todo(
    'refuse en CONFLICT un triplet levier, catégorie, titre déjà porté par une autre action'
  );
  it.todo(
    'refuse en BAD_REQUEST un titre ou une description vide, un levier ou une catégorie hors liste'
  );
});

describe('wiring', () => {
  it.todo('expose list et update sous shared.actionsDeReference');
});
