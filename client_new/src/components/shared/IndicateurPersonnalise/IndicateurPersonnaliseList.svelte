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

<div class="flex flex-row w-full items-center">

    <h3 class="text-2xl">Indicateurs personnalisés</h3>
    <div class="flex flex-grow"></div>
    <Button colorVariant={showCreation ? 'ash' : 'nettle'}
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
