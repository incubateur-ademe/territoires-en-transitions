<script lang="ts">
    import {FicheActionCategorie} from "../../../generated/models/fiche_action_categorie";
    import CategorieForm from './_CategorieForm.svelte'

    export let fiche: FicheActionCategorie
</script>

<div>
    <CategorieForm bind:data={fiche}/>
</div>