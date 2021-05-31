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


{#each [...displayedByAxe] as [parent, actions]}
    <h2 class="text-2xl mt-10 mb-2">{parent.nom}</h2>
    {#each actions as action}
        {#if searching}
            <ActionReferentielCard action={action} ficheButton emoji expandButton statusBar/>
        {:else }
            <ActionReferentielCard action={action} emoji link/>
        {/if}
    {/each}
{/each}
