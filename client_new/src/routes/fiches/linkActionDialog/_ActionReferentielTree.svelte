<script lang="ts">
    import ActionReferentielBar from './_ActionReferentielBar.svelte'
    import {ActionReferentiel} from '../../../../generated/models/action_referentiel'

    export let action: ActionReferentiel
    export let linkedActionIds: string[]
    export let handlePickButton

    // Helper handler to check if an action is linked to the current fiche
    $: isActionLinkedToFiche = (actionId) => linkedActionIds.includes(actionId)
</script>

<ActionReferentielBar action={action}
                      isAdded={isActionLinkedToFiche(action.id)}
                      handleAdd={handlePickButton}
                      handleRemove={handlePickButton}
>
    <div slot="children">
        {#each action.actions as nestedAction}
            <ActionReferentielBar action={nestedAction}
                                  isAdded={isActionLinkedToFiche(nestedAction.id)}
                                  handleAdd={handlePickButton}
                                  handleRemove={handlePickButton}
            />
        {/each}
    </div>
</ActionReferentielBar>