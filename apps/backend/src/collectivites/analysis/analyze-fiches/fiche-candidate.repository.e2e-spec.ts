import { describe, it } from 'vitest';

describe('FicheCandidateRepository contract', () => {
  it.todo(
    'every_fiche renvoie les fiches non supprimées des CT demandées, y compris hors plan et restreintes, sans les sous-fiches'
  );
  it.todo(
    "every_fiche avec 'all' renvoie les fiches non supprimées de toutes les CT"
  );
  it.todo(
    'every_fiche renvoie avec isDeleted à true les fiches supprimées en douce qui ont un statut'
  );
  it.todo(
    'pending_since renvoie les fiches non supprimées sans statut, en erreur ou périmées, quelle que soit leur date de modification'
  );
  it.todo(
    'pending_since renvoie les fiches traitées modifiées après la date donnée'
  );
  it.todo(
    'pending_since ne renvoie pas une fiche traitée modifiée avant la date donnée'
  );
  it.todo(
    'pending_since renvoie avec isDeleted à true les fiches supprimées en douce qui ont un statut'
  );
  it.todo("ne renvoie pas une fiche supprimée en douce qui n'a pas de statut");
  it.todo(
    'renvoie le titre, la description et la date de modification de chaque fiche, supprimée ou non'
  );
});
