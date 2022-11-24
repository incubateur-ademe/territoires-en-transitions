import '@testing-library/jest-dom/extend-expect';
import {IndicateurPersonnaliseDefinitionWriteEndpoint} from 'core-logic/api/endpoints/IndicateurPersonnaliseDefinitionWriteEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {IndicateurPersonnaliseDefinitionWrite} from 'generated/dataLayer/indicateur_personnalise_definition_write';
import {yiliCredentials} from 'test_utils/collectivites';

describe('Indicateur perso definition write endpoint', () => {
  beforeEach(async () => {
    await supabaseClient.auth.signInWithPassword(yiliCredentials);
  });

  it('Should allow saving and updating an indicateur perso definition when connected', async () => {
    const endpoint = new IndicateurPersonnaliseDefinitionWriteEndpoint();
    const def: IndicateurPersonnaliseDefinitionWrite = {
      collectivite_id: 2,
      commentaire: 'La vie est belle',
      description: "C'est important !",
      titre: 'Le bonheur',
      unite: 'heures',
    };
    // 1. create
    const createResult = await endpoint.save(def);
    expect(endpoint.lastResponse?.status).toBe(201);
    expect(createResult).not.toBeNull();
    expect(createResult).toEqual(expect.objectContaining(def));
    // 2. update
    const updatedDef = {...def, titre: 'La vie'};
    const updateResult = await endpoint.save(updatedDef);
    expect(updateResult).not.toBeNull();
    expect(updateResult).toEqual(expect.objectContaining(updatedDef));
  });

  // Fix me (#RLS).
  it('Should fail when connected user has no edition rights on collectivite (readonly)', async () => {
    const endpoint = new IndicateurPersonnaliseDefinitionWriteEndpoint();
    const indicateur_perso_def: IndicateurPersonnaliseDefinitionWrite = {
      collectivite_id: 8, // Yili has no rights on this collectivite
      commentaire: '',
      description: '',
      titre: '',
      unite: '',
    };
    const result = await endpoint.save(indicateur_perso_def);
    expect(endpoint.lastResponse?.status).toBe(403);
    expect(result).toBeNull();
  });
});
