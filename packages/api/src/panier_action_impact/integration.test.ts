import { assert } from "chai";
import { testReset } from "../tests/testReset";
import { supabase } from "../tests/supabase";
import { Panier } from "./types";
import { panierSelect } from "./panierAPI";

describe("Création de panier", async () => {
  before(async () => {
    await testReset();
  });

  it(
    "La fonction `panier_from_landing` devrait renvoyer un nouveau panier.",
    async () => {
      const { error, data } = await supabase.rpc("panier_from_landing");
      assert.isNull(
        error,
        `Créer un nouveau panier ne devrait pas renvoyer d'erreur`,
      );
      assert.exists(
        data,
        `Créer un panier devrait renvoyer un nouveau panier.`,
      );
      assert.exists(data.id, "Le nouveau panier devrait avoir un id");
    },
  );

  it(
    "La fonction `panier_from_landing` devrait un nouveau panier ou un panier récent.",
    async () => {
      const demandeInitiale = await supabase.rpc("panier_from_landing", {
        collectivite_id: 1,
      });
      assert.isNull(
        demandeInitiale.error,
        `Créer un nouveau panier ne devrait pas renvoyer d'erreur`,
      );
      assert.exists(
        demandeInitiale.data,
        `Créer un panier devrait renvoyer un nouveau panier.`,
      );
      assert.exists(
        demandeInitiale.data.id,
        "Le nouveau panier devrait avoir un id",
      );

      const demandeSuivante = await supabase.rpc("panier_from_landing", {
        collectivite_id: 1,
      });
      assert.equal(
        demandeSuivante.data.id,
        demandeInitiale.data.id,
        "La demande de panier suivant la création devrait renvoyer un panier avec le même id.",
      );
    },
  );
});

describe("État du panier", async () => {
  it("On devrait pouvoir sélectionner un panier", async () => {
    const demandePanier = await supabase.rpc("panier_from_landing");
    const panierId = demandePanier.data.id!;
    const selectPanier = await supabase.from("panier")
      .select()
      .eq("id", panierId).single();
    assert.isNull(
      selectPanier.error,
      `Sélectionner nouveau panier ne devrait pas renvoyer d'erreur`,
    );
    assert.exists(
      demandePanier.data,
      `Sélectionner un panier devrait renvoyer un panier.`,
    );
  });

  it(
    "On devrait pouvoir ajouter une action puis la retrouver dans le panier",
    async () => {
      const demandePanier = await supabase.rpc("panier_from_landing");
      const panierId = demandePanier.data.id!;
      const actionId = 1;
      const ajoutAction = await supabase.from("action_impact_panier").insert({
        action_id: actionId,
        panier_id: panierId,
      });
      assert.isNull(
        ajoutAction.error,
        `Ajouter une action au panier ne devrait pas renvoyer d'erreur`,
      );

      const selectPanierContenu = await supabase.from("panier")
        .select(panierSelect)
        .eq("id", panierId).single<Panier>();

      assert.isNull(
        selectPanierContenu.error,
        `Sélectionner un panier avec son contenu ne devrait pas renvoyer d'erreur`,
      );
      assert.exists(
        selectPanierContenu.data,
        `Sélectionner un panier devrait renvoyer un panier.`,
      );
      assert.equal(
        selectPanierContenu.data.contenu.length,
        1,
        `Le panier devrait contenir une action.`,
      );
    },
  );
});
describe("État des actions", async () => {
  it(
    "On devrait pouvoir ajouter une action puis la retrouver dans le panier",
    async () => {
      const demandePanier = await supabase.rpc("panier_from_landing");
      const panierId = demandePanier.data.id!;
      const actionId = 1;
      const ajoutAction = await supabase.from("action_impact_panier").insert({
        action_id: actionId,
        panier_id: panierId,
      });
      assert.isNull(
        ajoutAction.error,
        `Ajouter une action au panier ne devrait pas renvoyer d'erreur`,
      );

      const selectPanierContenu = await supabase.from("panier")
        .select(panierSelect)
        .eq("id", panierId).single<Panier>();

      assert.isNull(
        selectPanierContenu.error,
        `Sélectionner un panier avec son contenu ne devrait pas renvoyer d'erreur`,
      );
      assert.exists(
        selectPanierContenu.data,
        `Sélectionner un panier devrait renvoyer un panier.`,
      );
      assert.equal(
        selectPanierContenu.data.contenu.length,
        1,
        `Le panier devrait contenir une action.`,
      );

      const { error, data } = await supabase.from("panier")
        .select("*, states:action_impact_state(*)").eq("id", panierId);

      assert.isNull(error);
    },
  );
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