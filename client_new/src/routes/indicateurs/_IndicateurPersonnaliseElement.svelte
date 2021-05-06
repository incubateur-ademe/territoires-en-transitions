<script lang="ts">
    import {createEventDispatcher} from "svelte";
    import Button from "../../components/shared/Button/Button.svelte";
    import {IndicateurPersonnalise} from "../../../generated/models/indicateur_personnalise";
    import IndicateurForm from "./_IndicateurPersonnaliseForm.svelte"

    export let indicateur: IndicateurPersonnalise
    const dispatch = createEventDispatcher()

    let visibleindicateurEdition = false
    const handleEdit = (_) => {
        visibleindicateurEdition = true
    }

    const onSave = async (_) => {
        visibleindicateurEdition = false
        dispatch('save', {'indicateur': indicateur})
    }
</script>

<div class="flex flex-row">
    <h3 class="text-2xl flex-grow">{indicateur.nom}</h3>
    <Button classNames="self-end"
            label="Modifier"
            on:click={handleEdit}/>
</div>

{#if visibleindicateurEdition}
    <div class="bg-gray-200 p-4 mt-2 mb-5">
        <h5 class="text-lg">Modifier l'indicateur</h5>
        <IndicateurForm bind:data={indicateur} on:save={onSave}/>
    </div>
{/if}