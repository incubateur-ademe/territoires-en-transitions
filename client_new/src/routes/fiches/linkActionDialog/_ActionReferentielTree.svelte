<script lang="ts">
    import ActionReferentielBar from './_ActionReferentielBar.svelte'
    import {ActionReferentiel} from '../../../../generated/models/action_referentiel'

    export let action: ActionReferentiel
    export let linkedActionIds: string[]
    export let handlePickButton

    // Helper handler to check if an action is linked to the current fiche
    type isActionLinkedToFicheType = (actionId: string) => boolean
    $: isActionLinkedToFiche = (actionId) => linkedActionIds.includes(actionId)

    // Handle bar expansion
    type predicateType = (action: ActionReferentiel) => boolean
    const hasNestedActions: predicateType = (action) => action.actions && action.actions.length > 0
    const isExpandable: predicateType = (action) => hasNestedActions(action) || action.description.trim().length > 0
</script>

<ActionReferentielBar action={action}
                      isAdded={isActionLinkedToFiche(action.id)}
                      handleAdd={handlePickButton}
                      handleRemove={handlePickButton}
                      isExpandable={isExpandable(action)}
>
    <div slot="children">
        {#each action.actions as nestedAction}
            <ActionReferentielBar action={nestedAction}
                                  isAdded={isActionLinkedToFiche(nestedAction.id)}
                                  handleAdd={handlePickButton}
                                  handleRemove={handlePickButton}
                                  isExpandable={isExpandable(nestedAction)}
            />
        {/each}
    </div>
</ActionReferentielBar>