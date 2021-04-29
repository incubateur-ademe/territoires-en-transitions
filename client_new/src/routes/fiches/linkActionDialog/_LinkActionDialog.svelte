<script lang="ts">
    import {createEventDispatcher} from 'svelte'
    import Dialog from '../../../components/shared/Dialog.svelte'
    import LinkActionDialogIndex from './_LinkActionDialogIndex.svelte'
    import LinkActionDialogSubpage from './_LinkActionDialogSubpage.svelte'

    import {actions} from "../../../../generated/data/actions_referentiels";
    import {ActionReferentiel} from "../../../../generated/models/action_referentiel";

    // List of linked actions of the current fiche
    export let linkedActionIds: string[]

    // Handle action button callback
    export let handleActionButton

    // Helper handler to check if an action is linked to the current fiche
    export let isActionLinkedToFiche: (string) => boolean

    // Handle pick button callback
    export let handlePickButton: () => void

    let topLevelAction: ActionReferentiel | null

    const dispatch = createEventDispatcher()
    const close = () => dispatch('LinkActionDialogClose')

    const onTopLevelActionClicked = (actionId: string) => {
        const list = topLevelAction ? topLevelAction.actions : actions
        topLevelAction = list.find((action) => action.id == actionId)
    }

    const togglePopupContent = (event: MouseEvent) => {
        event.preventDefault()
        topLevelAction = actions.find((action) => action.actions.find((child) => child.id == topLevelAction.id))
    }
</script>

<Dialog ariaLabelledBy="dialog-title"
        handleClose={close}
        size="large">
    {#if topLevelAction}
        <LinkActionDialogSubpage
                linkedActionIds={linkedActionIds}
                handlePickButton={handlePickButton}
                topLevelAction={topLevelAction}
                togglePopupContent={togglePopupContent}/>
    {:else }
        <LinkActionDialogIndex
                handleActionButton={handleActionButton}
                isActionLinkedToFiche={isActionLinkedToFiche}
                onTopLevelActionClicked={onTopLevelActionClicked}
                close={close}/>
    {/if}
</Dialog>