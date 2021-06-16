<script lang="ts">
    import {ActionReferentiel} from "../../../../generated/models/action_referentiel";
    import ActionReferentielCard from "../../components/shared/ActionReferentiel/ActionReferentielCard.svelte";

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
</style>

{#each [...displayedByAxe] as [parent, actions]}
    <section>
        <h2>{parent.id_nomenclature}. {parent.nom}</h2>
        {#each actions as action}
            {#if searching}
                <ActionReferentielCard action={action} ficheButton expandButton statusBar/>
            {:else }
                <ActionReferentielCard action={action} link/>
            {/if}
        {/each}
    </section>
{/each}
