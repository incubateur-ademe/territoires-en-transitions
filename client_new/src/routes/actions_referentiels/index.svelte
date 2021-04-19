<script lang="ts">
    import ActionReferentielComponent from "../../components/shared/ActionReferentiel.svelte";
    import {onMount} from "svelte";
    import {ActionReferentiel} from "../../../generated/models/action_referentiel";
    import Button from "../../components/shared/Button/Button.svelte";

    const defaultSearchLimit = 10;
    const possiblyId = new RegExp('^\\d+');

    let timer: number;
    let needle: string;
    let displayed: ActionReferentiel[] = [];
    let allActions: ActionReferentiel[] = [];
    const searchLimit = (): number => {
        return loadMoreResults ? 1000 : defaultSearchLimit
    }

    let loadMoreResults: boolean = false;
    let resultsAboveLimit: boolean = false;

    const search = () => {
        if (needle) displayed = lookup(allActions, needle.toLowerCase(), possiblyId.test(needle))
        else displayed = allActions
    }

    const lookup = (actions: ActionReferentiel[], needle: string, asId: boolean): ActionReferentiel[] => {
        let results = []
        let limit = searchLimit() + 1;
        for (let i = 0; i < actions.length && results.length < limit; i++) {
            let action = actions[i]
            if (asId && action.id_nomenclature.startsWith(needle)) {
                results.push(action)
            } else if (action.nom.toLowerCase().includes(needle)) {
                results.push(action)
            } else {
                const found = lookup(action.actions, needle, asId);
                for (let j = 0; j < found.length && results.length < limit; j++) {
                    results.push(found[j])
                }
            }
        }
        resultsAboveLimit = results.length > searchLimit()
        return results.slice(0, searchLimit())
    }

    const debounce = (input_value) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            needle = input_value;
            search()
        }, 750);
    }

    const handleMoreOrLess = (_) => {
        loadMoreResults = !loadMoreResults;
        search();
    }

    onMount(async () => {
        let referentiel = await import("../../../generated/data/actions_referentiels")
        displayed = allActions = referentiel.actions
    });
</script>

<label>
    Recherche
    <input class="border border-gray-400 rounded px-2 py-1 shadow-sm outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full"
            on:keyup={({ target: { value } }) => debounce(value)}/>
</label>

{#each displayed as action}
    <ActionReferentielComponent action={action}/>
{/each}

{#if resultsAboveLimit}
    <Button full
            label="{loadMoreResults ? 'montrer moins d\'actions' : 'montrer plus d\'actions'}"
            on:click={handleMoreOrLess}
            classNames="md:w-1/3 self-end"
    />
{/if}