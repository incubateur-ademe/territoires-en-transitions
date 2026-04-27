import { describe, expect, it } from 'vitest';
import { supabase } from '../tests/supabase';
import { PanierAPI } from './panierAPI';

describe('Création de panier', async () => {
  it('La fonction `panier_from_landing` devrait renvoyer un nouveau panier.', async () => {
    const { error, data } = await supabase.rpc('panier_from_landing');

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.id).toBeDefined();
  });

  it('La fonction `panier_from_landing` devrait un nouveau panier ou un panier récent.', async () => {
    const demandeInitiale = await supabase.rpc('panier_from_landing', {
      collectivite_id: 1,
    });

    expect(demandeInitiale.error).toBeNull();
    expect(demandeInitiale.data).toBeDefined();
    expect(demandeInitiale.data?.id).toBeDefined();

    const demandeSuivante = await supabase.rpc('panier_from_landing', {
      collectivite_id: 1,
    });

    // La demande de panier suivant la création devrait renvoyer un panier avec le même id.
    expect(demandeSuivante.data?.id).toBeDefined();
    expect(demandeSuivante.data?.id).toEqual(demandeInitiale.data?.id);
  });
});

describe('État du panier', async () => {
  it('On devrait pouvoir sélectionner un panier', async () => {
    const demandePanier = await supabase.rpc('panier_from_landing');
    const panierId = demandePanier.data?.id as string;
    const selectPanier = await supabase
      .from('panier')
      .select()
      .eq('id', panierId)
      .single();

    expect(selectPanier.error).toBeNull();
    expect(selectPanier.data).toBeDefined();
  });
});
describe('État des actions', async () => {
  it('On devrait pouvoir ajouter une action puis la retrouver dans le panier', async () => {
    const demandePanier = await supabase.rpc('panier_from_landing');
    const panierId = demandePanier.data?.id as string;
    const existingActionImpact = await supabase
      .from('action_impact')
      .select('id')
      .limit(1)
      .maybeSingle();

    expect(existingActionImpact.error).toBeNull();

    let actionId = existingActionImpact.data?.id;
    if (!actionId) {
      const createdActionImpact = await supabase
        .from('action_impact')
        .insert({
          titre: 'Action impact de test',
          description: 'Créée par le test d’intégration panier',
        })
        .select('id')
        .single();

      expect(createdActionImpact.error).toBeNull();
      expect(createdActionImpact.data?.id).toBeDefined();
      actionId = createdActionImpact.data?.id;
    }

    // Assure un état déterministe sans reset global de la base.
    await supabase
      .from('action_impact_panier')
      .delete()
      .eq('panier_id', panierId);

    const ajoutAction = await supabase.from('action_impact_panier').insert({
      action_id: actionId as number,
      panier_id: panierId,
    });

    expect(ajoutAction.error).toBeNull();

    const api = new PanierAPI(supabase);
    const selectPanierContenu = await api.fetchPanier({ panierId, filtre: {} });

    expect(selectPanierContenu).toBeDefined();
    expect(selectPanierContenu?.inpanier.length).toEqual(1);
  });
});

/*
describe("Temps réel", async () => {
  it(`On devrait recevoir un événement par ajout d'action`, async () => {
    const demandeInitiale = await supabase.rpc("panier_from_landing");
    const panierId = demandeInitiale.data.id;
    const payloads = [];

    // On écoute les changements pour le panier que l'on vient de créer.
    supabase.channel("panier-changes").on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "panier",
        filter: `id=eq.${panierId}`,
      },
      function (payload) {
        payloads.push(payload);
      },
    ).subscribe();

    // On ajoute deux actions.
    await supabase.from("action_impact_panier").insert({
      action_id: 1,
      panier_id: panierId,
    });
    await supabase.from("action_impact_panier").insert({
      action_id: 2,
      panier_id: panierId,
    });

    await new Promise((_) => setTimeout(_, 500));
    assert.equal(
      payloads.length,
      2,
      `On devrait avoir reçu deux événements, un pour chaque action ajoutée au panier.`,
    );
  });
});
*/
