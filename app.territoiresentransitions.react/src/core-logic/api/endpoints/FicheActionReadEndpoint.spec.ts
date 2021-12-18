import '@testing-library/jest-dom/extend-expect';
import {ficheActionReadEndpoint} from 'core-logic/api/endpoints/FicheActionReadEndpoint';

describe('Fiche action reading endpoint ', () => {
  it('should retrieve data-layer default fiche for collectivite #1 ', async () => {
    const results = await ficheActionReadEndpoint.getBy({
      collectivite_id: 1,
    });

    expect(results.length).toBeGreaterThanOrEqual(1);
    const partialExpectedReadFicheAction = {
      collectivite_id: 1,
      avancement: 'pas_fait',
      numerotation: 'A0',
      titre: 'titre',
      description: 'description',
      structure_pilote: 'pilote',
      personne_referente: 'référente',
      elu_referent: 'référent',
      partenaires: 'partenaires',
      budget_global: '€',
      commentaire: 'commentaire',
      date_fin: 'fin',
      date_debut: 'début',
      action_ids: ['cae'],
      indicateur_ids: ['ind0'],
      indicateur_personnalise_ids: [1],
    };
    expect(results[0]).toEqual(
      expect.objectContaining(partialExpectedReadFicheAction)
    );
  });
  it('should retrieve 0 fiches for collectivite #2 ', async () => {
    const results = await ficheActionReadEndpoint.getBy({
      collectivite_id: 2,
    });
    expect(results.length).toEqual(0);
  });
});
2;
