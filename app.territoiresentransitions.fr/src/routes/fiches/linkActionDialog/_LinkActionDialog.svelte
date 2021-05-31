<script lang="ts">
    /**
     * The main dialog component to link actions to a fiche.
     *
     * Essentially switch between LinkActionDialogIndex and LinkActionDialogSubpage
     * given the selected topLevelAction.
     *
     * Passes linkedActionIds and toggleActionId props along to its children.
     */
    import {createEventDispatcher} from 'svelte'
    import Dialog from '../../../components/shared/Dialog.svelte'
    import LinkActionDialogIndex from './_LinkActionDialogIndex.svelte'
    import LinkActionDialogSubpage from './_LinkActionDialogSubpage.svelte'

    import {actions} from "../../../../../generated/data/actions_referentiels";
    import {ActionReferentiel} from "../../../../../generated/models/action_referentiel";

    // List of linked actions of the current fiche
    export let linkedActionIds: string[]

    // Handle pick button callback.
    export let toggleActionId: () => void

    // The action selected by the user.
    let topLevelAction: ActionReferentiel | null

    const dispatch = createEventDispatcher()
    const close = () => dispatch('LinkActionDialogClose')

    /// Used by LinkActionDialogIndex
    const selectTopAction = (actionId: string) => {
        const list = topLevelAction ? topLevelAction.actions : actions
        topLevelAction = list.find((action) => action.id == actionId)
    }

    // Called by the back button.
    const showIndex = (event: MouseEvent) => {
        topLevelAction = null
    }
</script>

<Dialog ariaLabelledBy="dialog-title"
        handleClose={close}
        size="large">
    {#if topLevelAction}
        <LinkActionDialogSubpage
                linkedActionIds={linkedActionIds}
                toggleActionId={toggleActionId}
                topLevelAction={topLevelAction}
                handleBack={showIndex}/>
    {:else }
        <LinkActionDialogIndex
                linkedActionIds={linkedActionIds}
                toggleActionId={toggleActionId}
                onTopLevelActionClicked={selectTopAction}
                close={close}/>
    {/if}
</Dialog>