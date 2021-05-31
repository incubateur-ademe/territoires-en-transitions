<script lang="ts">
    import {FicheActionCategorie} from "../../../../generated/models/fiche_action_categorie";
    import CategorieForm from './_CategorieForm.svelte'
    import {createEventDispatcher} from "svelte";
    import Button from "../../components/shared/Button/Button.svelte";

    export let categorie: FicheActionCategorie
    const dispatch = createEventDispatcher()

    let nom = categorie.nom // avoid binding

    let visibleCategorieEdition = false
    const handleEdit = (_) => {
        visibleCategorieEdition = true
    }

    const onSave = async (_) => {
        visibleCategorieEdition = false
        nom = categorie.nom
        dispatch('save', {'categorie': categorie})
    }
</script>

<div class="flex flex-row">
    <h3 class="text-2xl flex-grow">{nom}</h3>
    <Button classNames="self-end"
            label="Modifier"
            on:click={handleEdit}/>
</div>

{#if visibleCategorieEdition}
    <div class="bg-gray-200 p-4 mt-2 mb-5">
        <h5 class="text-lg">Modifier la catégorie</h5>
        <CategorieForm bind:data={categorie} on:save={onSave}/>
    </div>
{/if}