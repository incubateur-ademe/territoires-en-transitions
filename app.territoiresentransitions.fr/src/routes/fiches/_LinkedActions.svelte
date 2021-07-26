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
    import ActionStatus from "$components/shared/ActionStatus.svelte"

    export let actionIds: string[]
    export let handlePickButton: (actionId: string) => void
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
	.linked-action {
		display: flex;
		align-items: baseline;
		justify-content: space-around;
	}

	.linked-action .title-and-status {
		flex-basis: 75%;
	}
</style>

<ul>
	{#each actionIdsHistory as actionId}
		<li>
			<div class="linked-action">
				<PickButton
					picked={actionIds.includes(actionId)}
					handlePick={() => {
						handlePickButton(actionId)
					}}
					handleUnpick={() => {
						handlePickButton(actionId)
					}}
					pickLabel={"Lier"}
					unpickLabel="Liée"
				/>
				<div class="title-and-status">
					<ActionReferentielTitle action={referentielById[actionId]} />
					<ActionStatus {actionId} />
				</div>
			</div>
		</li>{/each}
</ul>