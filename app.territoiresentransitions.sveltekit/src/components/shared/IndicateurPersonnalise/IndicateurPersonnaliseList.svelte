<script lang="ts">
    import type {IndicateurPersonnaliseStorable} from "$storables/IndicateurPersonnaliseStorable";
    import {onMount} from "svelte";
    import IndicateurPersonnaliseElement from "./IndicateurPersonnaliseCard.svelte"
    import IndicateurPersonnaliseCreationDialog from "./IndicateurPersonnaliseCreationDialog.svelte"
    
    let indicateurs: IndicateurPersonnaliseStorable[] = []
    let showCreation: boolean = false

    const handleNewIndicateur = () => {
        showCreation = true
    }

    const refresh = async () => {
        const hybridStores = await import ("$api/hybridStores");
        showCreation = false
        indicateurs = await hybridStores.indicateurPersonnaliseStore.retrieveAll()
    }

    const handleDialogClose = async () => {
        showCreation = false
        await refresh()
    }

    onMount(async () => {
        await refresh()
    })



</script>

<style>
    .indicator__intro {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 2.5rem;
    }

    .indicators {
        max-width: 75%;
    }
</style>

<div class="indicator__intro">
    <h2 class="fr-h2">Mes indicateurs</h2>
    <button class="fr-btn fr-btn--secondary" on:click|preventDefault={handleNewIndicateur}>
        Ajouter un indicateur
    </button>
</div>


{#if showCreation}
        <IndicateurPersonnaliseCreationDialog
         on:AddDialogClose={handleDialogClose}
        />
{/if}


<div class="indicators">
    {#each indicateurs as indicateur}
        <IndicateurPersonnaliseElement indicateur={indicateur}/>
    {/each}
</div>
