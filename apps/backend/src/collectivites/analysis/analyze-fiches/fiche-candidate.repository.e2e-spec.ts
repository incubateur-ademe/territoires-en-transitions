import { describe, it } from 'vitest';

describe('FicheCandidateRepository contract', () => {
  it.todo(
    'listCollectivitesWithFicheCandidates renvoie les CT qui ont au moins une fiche non supprimée, y compris hors plan ou restreinte'
  );
  it.todo(
    'listCollectivitesWithFicheCandidates renvoie une CT dont la seule fiche est supprimée en douce et a un statut'
  );
  it.todo(
    "listCollectivitesWithFicheCandidates ne renvoie pas une CT qui n'a que des sous-fiches ou des fiches supprimées sans statut"
  );
  it.todo(
    'every_fiche renvoie les fiches non supprimées de la CT demandée, y compris hors plan et restreintes, sans les sous-fiches'
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
  it.todo("ne renvoie pas les fiches d'une autre CT");
  it.todo(
    'renvoie le titre, la description et la date de modification de chaque fiche, supprimée ou non'
  );
});
