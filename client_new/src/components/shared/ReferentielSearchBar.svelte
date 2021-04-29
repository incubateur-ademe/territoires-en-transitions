<script lang="ts">
    /**
     * Provides matches for a *given* list of actions.
     */

    import {ActionReferentiel} from "../../../generated/models/action_referentiel";
    import {ActionReferentielSearch} from "../../api/search";
    import {onDestroy, onMount} from "svelte";

    const search = new ActionReferentielSearch()

    export let matches: ActionReferentiel[] = [];
    export let actions: ActionReferentiel[] = [];
    export let needle: string = '';

    search.haystack = actions


    let onSearch = () => {
        needle = search.needle
        matches = search.matches
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