<script lang="ts">
    import {FicheActionCategorieInterface} from "../../../generated/models/fiche_action_categorie";
    import CategorieForm from './_CategorieForm.svelte'
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../api/currentEpci";
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

<div class="bg-gray-200 p-4 mt-2 mb-5">
    <h5 class="text-lg">Nouvelle catégorie</h5>
    <CategorieForm bind:data={data} on:save/>
</div>
