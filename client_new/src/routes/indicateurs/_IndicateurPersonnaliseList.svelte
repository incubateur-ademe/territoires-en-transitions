<script lang="ts">
    import {indicateurPersonnaliseStore} from "../../api/localStore";
    import {IndicateurPersonnaliseStorable} from "../../storables/IndicateurPersonnaliseStorable";
    import {onMount} from "svelte";
    import IndicateurPersonnaliseElement from "./_IndicateurPersonnaliseElement.svelte"
    import IndicateurPersonaliseCreation from "./_IndicateurPersonaliseCreation.svelte"
    import Button from "../../components/shared/Button/Button.svelte";

    let indicateurs: IndicateurPersonnaliseStorable[] = []
    let showCreation: boolean = false

    const handleNewIndicateur = () => {
        showCreation = true
    }

    const refresh = async () => {
        // todo use API
        indicateurs = await indicateurPersonnaliseStore.retrieveAll()
        console.log('indicateurs', indicateurs)
    }

    onMount(async () => {
        refresh()
    })

</script>

<div class="flex flex-row w-full items-center">

    <h3 class="text-2xl">Indicateurs personalisés</h3>
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
