<script lang="ts">
    import PageBar from '../../../routes/actions_referentiels/_ActionReferentielBar.svelte'
    import DialogBar from '../../../routes/fiches/linkActionDialog/_ActionReferentielBar.svelte'
    import {ActionReferentiel} from '../../../../generated/models/action_referentiel'

    // The type of bar
    type Bar = 'PageBar' | 'DialogBar'

    // Main action of the tree
    export let action: ActionReferentiel

    // Determine the bar component to render for the tree
    export let bar: Bar = 'PageBar'

    // Only for DialogBar: store the array of actions that are linked to the current fiche
    export let linkedActionIds: string[] = []

    // Only for DialogBar: handle PickButton add/remove callback
    export let handlePickButton: () => void = () => {}

    // Helper handler to check if an action is linked to the current fiche
    $: isActionLinkedToFiche = (actionId) => linkedActionIds.includes(actionId)

    // Handle bar component display
    const barComponents= {
        PageBar: PageBar,
        DialogBar: DialogBar,
    }

    // PageBar component prop
    let pageBarProps = {}
    const isPageBar = bar == 'PageBar'
    if (isPageBar) {
        pageBarProps = {
            ficheButton: true,
            statusBar: true,
        }
    }

    // DialogBar component prop
    let dialogBarProps = {}
    const isDialogBar = bar == ' '
    if (isDialogBar) {
        dialogBarProps = {
            handleAdd: handlePickButton,
            handleRemove: handlePickButton,
        }
    }

    // Handle bar expansion
    type actionPredicate = (action: ActionReferentiel) => boolean
    const hasNestedActions: actionPredicate = (action) => action.actions && action.actions.length > 0
    const isExpandable: actionPredicate = (action) => hasNestedActions(action) || action.description.trim().length > 0
</script>

<svelte:component this={barComponents[bar]}
                  action={action}
                  isExpandable={isExpandable(action)}
                  {...pageBarProps }
                  {...dialogBarProps }
                  isAdded={isDialogBar ? isActionLinkedToFiche(action.id) : null}
>
    <div slot="children">
        {#each action.actions as nestedAction}
            <svelte:component this={barComponents[bar]}
                              action={nestedAction}
                              isExpandable={isExpandable(nestedAction)}
                              {...pageBarProps}
                              {...dialogBarProps}
                              isAdded={isDialogBar ? isActionLinkedToFiche(nestedAction.id) : null}
            />
        {/each}
    </div>
</svelte:component>
