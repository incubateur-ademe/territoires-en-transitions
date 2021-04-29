<script lang="ts">
    /**
     * Provides matches for a *given* list of actions.
     */

    import {ActionReferentiel} from "../../../generated/models/action_referentiel";

    const possiblyId = new RegExp('^\\d+');

    export let matches: ActionReferentiel[] = [];
    export let actions: ActionReferentiel[] = [];


    let timer: number;
    export let needle: string = '';

    const search = () => {
        if (needle) matches = lookup(actions, needle.toLowerCase(), possiblyId.test(needle))
        else matches = actions
    }

    const lookup = (actions: ActionReferentiel[], needle: string, asId: boolean): ActionReferentiel[] => {
        let results = []
        for (let i = 0; i < actions.length; i++) {
            let action = actions[i]
            if (asId && action.id_nomenclature.startsWith(needle)) {
                results.push(action)
            } else if (action.nom.toLowerCase().includes(needle)) {
                results.push(action)
            } else {
                const found = lookup(action.actions, needle, asId);
                for (let j = 0; j < found.length; j++) {
                    results.push(found[j])
                }
            }
        }
        return results
    }

    const debounce = (input_value) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            needle = input_value;
            search()
        }, 750);
    }
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
           on:keyup={({ target: { value } }) => debounce(value)}/>
</label>