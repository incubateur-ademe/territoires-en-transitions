<script lang="ts">
    /**
     * Provides matches for a *given* list of actions.
     */

    import {IndicateurReferentielSearch} from "../../api/search";
    import {onDestroy, onMount} from "svelte";
    import {IndicateurReferentiel} from "../../generated/models/indicateur_referentieliel";

    const search = new IndicateurReferentielSearch()

    export let matches: IndicateurReferentiel[] = [];
    export let indicateurs: IndicateurReferentiel[] = [];
    export let searchCallBack: () => void = () => {}
    export let needle: string = '';

    search.haystack = indicateurs


    let onSearch = () => {
        needle = search.needle
        matches = search.matches
        searchCallBack()
    }

    onMount(() => {
        search.addListener(onSearch)
    })

    onDestroy(() => {
        search.removeListener(onSearch)
    })
</script>

<style>
    div {
        display: flex;
    }

    input {
        box-shadow: inset 0 -2px 0 0 var(--bf500);
        border-radius: 0.25rem 0 0 0;
    }

    button {
        border-radius: 0 0.25rem 0 0;
    }
</style>

<div>
    <input class="fr-input" type="search" placeholder="Rechercher"
           on:keyup={({ target: { value } }) => search.search(value)}/>
    <button class="fr-btn fr-fi-search-line fr-btn--icon" title="Rechercher">
    <span class="sr-only">
        Rechercher
    </span>
    </button>
</div>