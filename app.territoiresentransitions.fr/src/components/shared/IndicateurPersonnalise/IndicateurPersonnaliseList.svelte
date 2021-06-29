<script lang="ts">
    import {IndicateurPersonnaliseStorable} from "../../../storables/IndicateurPersonnaliseStorable";
    import {onMount} from "svelte";
    import IndicateurPersonnaliseElement from "./IndicateurPersonnaliseCard.svelte"
    import IndicateurPersonaliseCreation from "./IndicateurPersonnaliseCreation.svelte"
    import Button from "../Button/Button.svelte";

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

    onMount(async () => {
        await refresh()
    })

</script>

<style>
    .indicator__intro {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .indicators {
        max-width: 75%;
    }
</style>

<div class="indicator__intro">
    <h2>Mes indicateurs</h2>
    <button class="fr-btn fr-btn--secondary" on:click|preventDefault={handleNewIndicateur}>
        Nouvel indicateur
    </button>
</div>

{#if showCreation}
    <IndicateurPersonaliseCreation on:save={refresh}/>
{/if}

<div class="indicators">
    {#each indicateurs as indicateur}
        <IndicateurPersonnaliseElement indicateur={indicateur}/>
    {/each}
</div>
