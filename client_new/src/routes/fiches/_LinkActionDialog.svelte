<script lang="ts">
    import {createEventDispatcher} from 'svelte'
    import Dialog from '../../components/shared/Dialog.svelte'
    import LinkActionDialogIndex from './_LinkActionDialogIndex.svelte'
    import LinkActionDialogSubpage from './_LinkActionDialogSubpage.svelte'

    export let actions
    export let thematiques

    let showSubpage = false
    let topLevelAction
    const dispatch = createEventDispatcher()
    const actionsById = actions.reduce((acc, action) => {
        acc[action.id] = action
        return acc
    }, {})
    const thematiquesWithActions = Object.values(actionsById).reduce((acc, action) => {
        const thematiqueId = action['thematique_id']
        let actions = []

        if (acc[thematiqueId]) actions = acc[thematiqueId]

        actions.push(action)
        acc[thematiqueId] = actions

        return acc
    }, {})

    const close = () => dispatch('LinkActionDialogClose')

    const onTopLevelActionClicked = (actionId) => () => {
        topLevelAction = actionsById[actionId]
        showSubpage = !showSubpage
    }

    const togglePopupContent = (event: MouseEvent) => {
        event.preventDefault()
        showSubpage = !showSubpage
    }
</script>

<Dialog size="large"
        ariaLabelledBy="dialog-title"
        handleClose={close}
>
    {#if !showSubpage}
        <LinkActionDialogIndex
                thematiquesWithActions={thematiquesWithActions}
                thematiques={thematiques}
                onTopLevelActionClicked={onTopLevelActionClicked}
                close={close}
        />
    {/if}

    {#if showSubpage}
        <LinkActionDialogSubpage
            topLevelAction={topLevelAction}
            togglePopupContent={togglePopupContent}
        />
    {/if}
</Dialog>