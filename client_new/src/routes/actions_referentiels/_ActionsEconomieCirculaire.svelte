<script lang="ts">
    import {ActionReferentiel} from "../../../generated/models/action_referentiel";
    import ActionReferentielCard from "../../components/shared/ActionReferentiel/ActionReferentielCard.svelte";

    export let searching: boolean

    export let displayed: ActionReferentiel[]

    $: displayed, refresh()

    let displayedByParent: Map<ActionReferentiel, ActionReferentiel[]>

    const refresh = () => {
        const map = new Map<ActionReferentiel, ActionReferentiel[]>()
        const children: ActionReferentiel[] = []
        const parents: ActionReferentiel[] = []

        for (let action of displayed) {
            for (let level1 of action.actions) {
                parents.push(level1)
                for (let level2 of level1.actions) {
                    children.push(level2)
                }
            }
        }

        for (let parent of parents) {
            const actions = children.filter(
                (action) => action.id.startsWith(parent.id) && action.id.startsWith('economie_circulaire')
            )
            if (actions.length) map.set(parent, actions)
        }
        displayedByParent = map;
    }

    refresh()
</script>


{#each [...displayedByParent] as [parent, actions]}
    <h2 class="text-2xl mt-10 mb-2">{parent.nom}</h2>
    {#each actions as action}
        {#if searching}
            <ActionReferentielCard action={action} ficheButton emoji expandButton statusBar/>
        {:else }
            <ActionReferentielCard action={action} emoji link/>
        {/if}
    {/each}
{/each}
