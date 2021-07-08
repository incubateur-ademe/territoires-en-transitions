<script lang="ts">
    import {IndicateurPersonnaliseStorable} from "../../../storables/IndicateurPersonnaliseStorable";
    import {onMount} from "svelte";
    import IndicateurPersonnaliseElement from "./IndicateurPersonnaliseCard.svelte"
    import IndicateurPersonaliseCreation from "./IndicateurPersonnaliseCreation.svelte"
    import IndicateurPersonaliseCreatioDialog from "./IndicateurPersonnaliseCreationDialog.svelte"

    let indicateurs: IndicateurPersonnaliseStorable[] = []
    let showCreation: boolean = false

    const handleNewIndicateur = () => {
        showCreation = true
    }

    const refresh = async () => {
        const hybridStores = await import ("../../../api/hybridStores");
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
    <h2>Mes indicateurs</h2>
    <button class="fr-btn fr-btn--secondary" on:click|preventDefault={handleNewIndicateur}>
        Ajouter un indicateur
    </button>
</div>


{#if showCreation}
    {#await import('./IndicateurPersonaliseCreatioDialog.svelte') then c}
        <svelte:component this={c.default}
                          on:AddDialogClose={handleDialogClose}
        />
    {/await}
{/if}


<div class="indicators">
    {#each indicateurs as indicateur}
        <IndicateurPersonnaliseElement indicateur={indicateur}/>
    {/each}
</div>
