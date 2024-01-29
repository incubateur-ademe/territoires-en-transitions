import {assert} from 'chai';
import {testReset} from '../tests/testReset';
import {supabase} from '../tests/supabase';
import {Database} from '../database.types';

type Panier =
/* Le panier en tant que tel */
  Database['public']['Tables']['panier']['Row'] & {
  /* Liste d'actions */
  actions: Database['public']['Tables']['action_impact']['Row'][]
}

/**
 * On sélectionne toutes les colonnes du panier : *
 * puis les `action_impact` par la relation `action_impact_panier` que l'on renomme `actions`
 */
const panierSelect = '*, actions:action_impact!action_impact_panier(*)';

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

describe('État du panier', async () => {
  it('On devrait pouvoir sélectionner un panier',
    async () => {
      const demandePanier = await supabase.rpc('panier_from_landing');
      const panierId = demandePanier.data.id!;
      const selectPanier = await supabase.from('panier').
        select().
        eq('id', panierId).single();
      assert.isNull(selectPanier.error,
        `Sélectionner nouveau panier ne devrait pas renvoyer d'erreur`);
      assert.exists(demandePanier.data,
        `Sélectionner un panier devrait renvoyer un panier.`);
    });

  it('On devrait pouvoir ajouter une action puis la retrouver dans le panier',
    async () => {
      const demandePanier = await supabase.rpc('panier_from_landing');
      const panierId = demandePanier.data.id!;
      const actionId = 0;
      const ajoutAction = await supabase.from('action_impact_panier').insert({
        action: actionId,
        panier: panierId,
      });
      assert.isNull(ajoutAction.error,
        `Ajouter une action au panier ne devrait pas renvoyer d'erreur`);

      const selectPanierContenu = await supabase.from('panier').
        select(panierSelect).
        eq('id', panierId).single<Panier>();

      assert.isNull(selectPanierContenu.error,
        `Sélectionner un panier avec son contenu ne devrait pas renvoyer d'erreur`);
      assert.exists(selectPanierContenu.data,
        `Sélectionner un panier devrait renvoyer un panier.`);
      assert.equal(selectPanierContenu.data.actions.length, 1,
        `Le panier devrait contenir une action.`);
    });

});

