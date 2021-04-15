<script lang="ts">
    import {FicheActionCategorie} from "../../../generated/models/fiche_action_categorie";
    import CategorieForm from './_CategorieForm.svelte'

    export let fiche: FicheActionCategorie
</script>

<div class="bg-gray-200 p-4 mt-2 mb-5">
    <h5 class="text-lg">Modifier la catégorie</h5>
    <CategorieForm bind:data={fiche}/>
</div>
