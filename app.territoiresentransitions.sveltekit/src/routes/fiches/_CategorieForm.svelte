<script lang="ts">
    import type {FicheActionCategorieInterface} from "$generated/models/fiche_action_categorie";
    import {FicheActionCategorieStorable} from "../../storables/FicheActionCategorieStorable";
    import {createEventDispatcher, onMount} from "svelte";
    import type {HybridStore} from "../../api/hybridStore";

    export let data: FicheActionCategorieInterface
    let categorieStore: HybridStore<FicheActionCategorieStorable>
    const dispatch = createEventDispatcher()

    onMount(async () => {
        const hybridStores = await import ("../../api/hybridStores");
        categorieStore = hybridStores.ficheActionCategorieStore;
    })

    const handleSave = async () => {
        if (!data.nom) return;
        const categorie = new FicheActionCategorieStorable(data)
        const saved = await categorieStore.store(categorie)
        dispatch('save', {'categorie': saved})
    }
</script>

<style>
    .fr-btn {
        margin-top: 1rem;
    }
</style>

<div>
    <label class="fr-label" for="fiche_create_nom">Nom</label>

    <input bind:value={data.nom}
           class="fr-input"
           id="fiche_create_nom"
           maxlength="100">

    <button class="fr-btn fr-btn--secondary"
            on:click={handleSave}>
        Valider
    </button>
</div>