<script lang="ts">
    import {createEventDispatcher} from 'svelte'
    import Dialog from '../../components/shared/Dialog.svelte'
    import LinkActionDialogIndex from './_LinkActionDialogIndex.svelte'
    import LinkActionDialogSubpage from './_LinkActionDialogSubpage.svelte'

    import {actions} from "../../../generated/data/actions_referentiels";
    import {ActionReferentiel} from "../../../generated/models/action_referentiel";

    let topLevelAction: ActionReferentiel | null

    const dispatch = createEventDispatcher()


    const close = () => dispatch('LinkActionDialogClose')

    const onTopLevelActionClicked = (actionId) => () => {
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
                topLevelAction={topLevelAction}
                togglePopupContent={togglePopupContent}/>
    {:else }
        <LinkActionDialogIndex
                onTopLevelActionClicked={onTopLevelActionClicked}
                close={close}/>
    {/if}
</Dialog>