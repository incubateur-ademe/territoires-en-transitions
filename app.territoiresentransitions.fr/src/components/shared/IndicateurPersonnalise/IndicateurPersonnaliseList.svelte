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
    div {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
</style>

<div>
    <h2>Mes indicateurs</h2>
    <Button classNames="fr-btn" ton colorVariant={showCreation ? 'ash' : 'nettle'}
            on:click={handleNewIndicateur}>
        Nouvel indicateur
    </Button>
</div>

{#if showCreation}
    <IndicateurPersonaliseCreation on:save={refresh}/>
{/if}

{#each indicateurs as indicateur}
    <IndicateurPersonnaliseElement indicateur={indicateur}/>
{/each}                               
