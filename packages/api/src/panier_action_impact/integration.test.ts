import {assert} from 'chai';
import {testReset} from '../tests/testReset';
import {supabase} from '../tests/supabase';

describe('Création de panier', async () => {
  before(async () => {
    await testReset();
  });

  it('La fonction `panier_from_landing` devrait renvoyer un nouveau panier.',
    async () => {
      const {error, data} = await supabase.rpc('panier_from_landing');
      assert.isNull(error,
        `Créer un nouveau panier ne devrait pas renvoyer d'erreur`);
      assert.exists(data,
        `Créer un panier devrait renvoyer un nouveau panier.`);
      assert.exists(data.id, 'Le nouveau panier devrait avoir un id');
    });

  it(
    'La fonction `panier_from_landing` devrait un nouveau panier ou un panier récent.',
    async () => {
      const demandeInitiale = await supabase.rpc('panier_from_landing',
        {collectivite_id: 1});
      assert.isNull(demandeInitiale.error,
        `Créer un nouveau panier ne devrait pas renvoyer d'erreur`);
      assert.exists(demandeInitiale.data,
        `Créer un panier devrait renvoyer un nouveau panier.`);
      assert.exists(demandeInitiale.data.id,
        'Le nouveau panier devrait avoir un id');

      const demandeSuivante = await supabase.rpc('panier_from_landing',
        {collectivite_id: 1});
      assert.equal(demandeSuivante.data.id, demandeInitiale.data.id,
        'La demande de panier suivant la création devrait renvoyer un panier avec le même id.');
    });
});
