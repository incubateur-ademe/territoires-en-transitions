<script lang="ts">
    /**
     * Provides matches for a *given* list of actions.
     */

    import {ActionReferentiel} from "../../../../generated/models/action_referentiel";
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


<div>
    <input class="fr-input" type="search" placeholder="Rechercher"
           on:keyup={({ target: { value } }) => search.search(value)}/>
    <button class="fr-btn fr-fi-search-line fr-btn--icon" title="Rechercher">
    <span class="sr-only">
        Rechercher
    </span>
    </button>
</div>

<style>
    div {
        display: flex;
    }
</style>