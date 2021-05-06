<script lang="ts">
    /**
     * Provides matches for a *given* list of actions.
     */

    import {IndicateurReferentielSearch} from "../../api/search";
    import {onDestroy, onMount} from "svelte";
    import {IndicateurReferentiel} from "../../../generated/models/indicateur_referentiel";

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

<label class="flex flex-row items-center">
    Rechercher
    <input class="
    ml-4
    block w-full
    shadow-sm outline-none
    border border-gray-400 rounded
    px-2 py-1
    focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 "
           on:keyup={({ target: { value } }) => search.search(value)}/>
</label>