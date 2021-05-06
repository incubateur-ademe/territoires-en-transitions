<script lang="ts">
    import {indicateurPersonnaliseStore} from "../../api/localStore";
    import {IndicateurPersonnaliseStorable} from "../../storables/IndicateurPersonnalise";
    import {onMount} from "svelte";
    import IndicateurPersonnaliseElement from "./_IndicateurPersonnaliseElement.svelte"
    import IndicateurPersonaliseCreation from "./_IndicateurPersonaliseCreation.svelte"
    import Button from "../../components/shared/Button/Button.svelte";

    let indicateurs: IndicateurPersonnaliseStorable[] = []
    let showCreation: boolean = false

    const handleNewIndicateur = () => {
        showCreation = true
    }

    const refresh =async () => {
        // todo use API
        indicateurs = await indicateurPersonnaliseStore.retrieveAll()
        console.log('indicateurs', indicateurs)
    }

    onMount(async () => {
        refresh()
    })

</script>

<h3>Indicateurs personalisés</h3>

<Button colorVariant={showCreation ? 'ash' : ''}
        on:click={handleNewIndicateur}>
    Nouvel indicateur
</Button>

{#if showCreation}
    <IndicateurPersonaliseCreation on:save={refresh}/>
{/if}

{#each indicateurs as indicateur}
    <IndicateurPersonnaliseElement indicateur={indicateur}/>
{/each}
