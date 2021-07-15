<script lang="ts">
    import {ActionReferentiel} from "../../generated/models/action_referentieliel";
    import ActionReferentielCard from "../../components/shared/ActionReferentiel/ActionReferentielCard.svelte";
    import ProgressStat from "../../components/shared/ActionReferentiel/ProgressStat.svelte";

    export let searching: boolean

    export let displayed: ActionReferentiel[]

    $: displayed, refresh()

    let displayedByAxe: Map<ActionReferentiel, ActionReferentiel[]>

    const refresh = () => {
        const map = new Map<ActionReferentiel, ActionReferentiel[]>()
        const orientations: ActionReferentiel[] = []
        const axes: ActionReferentiel[] = []

        for (let action of displayed) {
            for (let level1 of action.actions) {
                axes.push(level1)
                for (let level2 of level1.actions) {
                    orientations.push(level2)
                }
            }
        }

        for (let parent of axes) {
            const actions = orientations.filter(
                (action) => action.id.startsWith(parent.id) && action.id.startsWith('economie_circulaire')
            )
            if (actions.length) map.set(parent, actions)
        }
        displayedByAxe = map;
    }

    refresh()
</script>

<style>
    section + section {
        margin-top: 3.75rem;
    }

    h2 {
        display: flex;
        margin-bottom: 1.875rem;
    }

    h2 :global([class^="progressBar"]) {
        flex-shrink: 0;
        margin-left: 1.5rem;
    }

    h2 :global([class^="progressBar"] strong) {
        font-size: 1.125rem;
    }

    h2 :global([class^="progressBar"]) {
        font-size: 1rem;
    }
</style>

{#each [...displayedByAxe] as [parent, actions]}
    <section>
        <h2>{parent.id_nomenclature} {parent.nom}</h2>
        <ProgressStat action={parent} position="left"/>
        <div style="height: 4em"></div>
        {#each actions as action}
            {#if searching}
                <ActionReferentielCard action={action} ficheButton expandButton statusBar/>
            {:else }
                <ActionReferentielCard action={action} link/>
            {/if}
        {/each}
    </section>
{/each}
