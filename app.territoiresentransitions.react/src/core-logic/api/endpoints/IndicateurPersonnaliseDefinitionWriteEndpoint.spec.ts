import '@testing-library/jest-dom/extend-expect';
import {IndicateurPersonnaliseDefinitionWriteEndpoint} from 'core-logic/api/endpoints/IndicateurPersonnaliseDefinitionWriteEndpoint';
import {supabase} from 'core-logic/api/supabase';
import {IndicateurPersonnaliseDefinitionWrite} from 'generated/dataLayer/indicateur_personnalise_definition_write';
import {yiliCredentials} from 'test_utils/collectivites';

describe('Indicateur perso definition write endpoint', () => {
  beforeEach(async () => {
    await supabase.auth.signIn(yiliCredentials);
  });

  it('Should return an equivalent object when saving an indicateur perso definition when connected', async () => {
    const endpoint = new IndicateurPersonnaliseDefinitionWriteEndpoint();
    const indicateur_perso_def: IndicateurPersonnaliseDefinitionWrite = {
      collectivite_id: 2,
      commentaire: 'La vie est belle',
      description: "C'est important !",
      titre: 'Le bonheur',
      unite: 'heures',
    };
    const actualIndicateurWrite = await endpoint.save(indicateur_perso_def);
    expect(actualIndicateurWrite).not.toBeNull();
    console.log('actualIndicateurWrite ', actualIndicateurWrite);
  });

  // Fix me.
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
    expect(result).toBeNull();
  });
});
