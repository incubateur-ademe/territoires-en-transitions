<script lang="ts">
    /**
     * List of actions with an add/remove button on each action.
     * The list is reactive and only keeps added actions.
     * Removed actions are not discarded.
     */
    import type {ActionReferentiel} from '$generated/models/action_referentiel'
    import {actions} from '$generated/data/actions_referentiels'
    import ActionReferentielTitle from '$components/shared/ActionReferentiel/ActionReferentielTitle.svelte'
    import PickButton from '$components/shared/ButtonV2/PickButton.svelte'

    export let actionIds: string[]
    export let handlePickButton: () => {}

    let actionIdsHistory: string[] = []

    $: {
        let actionIdsDelta = actionIdsHistory.filter(id => !actionIds.includes(id))
        actionIdsHistory = actionIds
            .concat(actionIdsDelta)
            .sort()
    }

    // Flatten referentiel actions and set them by id
    const actionsById = (actions: ActionReferentiel[]) => {
        const flattened = {}

        const flatten = (actionsToFlat: ActionReferentiel[]) => {
            for (let action of actionsToFlat) {
                flattened[action.id] = action

                if (action.actions) {
                    flatten(action.actions)
                }
            }
        }
        flatten(actions)

        return flattened
    }

    const referentielById = actionsById(actions)
</script>

<style>
    ul {
        margin-bottom: 2rem;
    }

    li {
        display: flex;
        align-items: center;
    }

    li + li {
        margin-top: 1.5rem;
    }

    li :global(h3) {
        margin-bottom: 0;
        margin-left: 1rem;
    }
</style>

<ul>
    {#each actionIdsHistory as actionId }
        <li>
            <PickButton picked={actionIds.includes(actionId)}
                        handlePick={() => { handlePickButton(actionId) }}
                        handleUnpick={() => { handlePickButton(actionId) }}
                        pickLabel="Ajouter"
                        unpickLabel="Ajouté"
            />
            <ActionReferentielTitle action={referentielById[actionId]}/>
        </li>
    {/each}
</ul>
