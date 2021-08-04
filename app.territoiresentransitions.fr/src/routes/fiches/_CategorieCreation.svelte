<script lang="ts">
    import type {FicheActionCategorieInterface} from "$generated/models/fiche_action_categorie";
    import CategorieForm from './_CategorieForm.svelte'
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "$api/currentEpci";
    import {v4 as uuid} from 'uuid'

    // Set from the `fiche action` form.
    export let ficheActionUid: string = ''

    let data: FicheActionCategorieInterface = {
        epci_id: '',
        uid: uuid(),
        parent_uid: '',
        nom: '',
        fiche_actions_uids: ficheActionUid ? [ficheActionUid] : [],
    }

    onMount(async () => {
        data.epci_id = getCurrentEpciId()

    });
</script>

<style>
    div {
        margin-top: 2rem;
        margin-left: 2rem;
        padding: 0 0 1rem 1rem;
        border-left: 4px solid var(--bf500);
    }

    h2 {
        font-size: 1.375rem;
    }
</style>

<div>
    <h2 class="fr-h2">Nouvelle catégorie</h2>
    <CategorieForm bind:data={data} on:save/>
</div>
