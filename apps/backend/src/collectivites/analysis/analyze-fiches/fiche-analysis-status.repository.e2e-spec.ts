import { describe, it } from 'vitest';

describe('FicheAnalysisStatusRepository contract', () => {
  it.todo(
    "upsertAnalyses d'une fiche traitée écrit le statut et l'empreinte, et remet le compteur à 0"
  );
  it.todo(
    "upsertAnalyses d'une fiche en erreur sans statut écrit un compteur à 1 et aucune empreinte"
  );
  it.todo(
    "upsertAnalyses d'une fiche en erreur déjà analysée incrémente le compteur et garde l'empreinte"
  );
  it.todo(
    "upsertAnalyses d'une fiche périmée remet le compteur à 0 et garde l'empreinte"
  );
  it.todo("chaque écriture met la date d'analyse à l'heure de la base");
  it.todo('deleteAnalyses supprime les statuts des fiches données');
  it.todo("la suppression physique d'une fiche supprime son statut");
  it.todo('listAnalyses renvoie les statuts des fiches demandées');
  it.todo(
    'listAnalysesOfAnalyzedCollectivites renvoie tous les statuts des CT qui ont au moins un statut'
  );
});
