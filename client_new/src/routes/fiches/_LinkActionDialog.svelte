<script lang="ts">
    import {createEventDispatcher} from 'svelte'
    import Dialog from '../../components/shared/Dialog.svelte'
    import ButtonIcon from '../../components/shared/Button/ButtonIcon.svelte'
    import ActionBar from '../../components/shared/Action/ActionBar.svelte'
    import ActionExpandable from '../../components/shared/Action/ActionExpandable.svelte'
    import Button from '../../components/shared/Button/Button.svelte'

    export let actions
    export let thematiques

    let showNestedPopupContent = false
    let topLevelAction
    let actionDescriptionDisplayed = false
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
        showNestedPopupContent = !showNestedPopupContent
    }

    const togglePopupContent = (event: MouseEvent) => {
        event.preventDefault()
        showNestedPopupContent = !showNestedPopupContent
    }
</script>

<style>
    details.expandable__with-arrow > summary::after {
        @apply text-6xl;
        transform: translateY(-1rem);
        content: '›';
    }

    details.expandable__with-arrow[open] > summary::after {
        @apply text-6xl;
        @apply relative;
        @apply -top-4;
        @apply font-normal;
        content: '›';
        transform: rotate(90deg) translate(10%, -10%);
    }

    .custom-oveflow {
        @apply overflow-auto;
        /**
         * The height of the dialog have to be set in order to apply the overflow-auto.
         * The constants applied here:
         *  - 90vh: the height of the Dialog component.
         *  - 6rem: approximatively the height of our dialog header.
         */
        height: calc(90vh - 6rem);
    }
</style>

<Dialog size="large"
        ariaLabelledBy="dialog-title"
        handleClose={close}
>

    {#if !showNestedPopupContent}
    <div class="bg-gray-100">
        <header class="bg-white px-14 py-4 grid grid-cols-4 justify-center">
            <a class="cursor-pointer underline col-span-1 text-left self-center"
               on:click|preventDefault={() => close() }
               href="#"
            >
                ‹ Retourner à la fiche
            </a>
            <h2 id="dialog-title" class="text-3xl font-bold col-span-2 text-center self-center py-4">Lier une action</h2>
        </header>
        <div class="p-14 focus:bg-gray-100 custom-oveflow">

            {#each Object.entries(thematiquesWithActions) as [thematiqueId, actions] }
                <details class="expandable expandable__with-arrow cursor-pointer">
                    <summary class="flex content-center">
                        <h3 class="text-3xl font-bold mb-10 mr-4">{thematiques[thematiqueId].name}</h3>
                    </summary>
                    <ul class="mb-16">
                        {#each actions as action (action.id) }
                            <li>
                                <ActionBar withArrow
                                           withShadow
                                           classNames="mb-4"
                                >
                                    <ButtonIcon slot="aside">+</ButtonIcon>
                                    <h4 class="underline:hover self-center mr-4">
                                        <a href="#" on:click|preventDefault={onTopLevelActionClicked(action.id)}>
                                            {action.nom}
                                        </a>
                                    </h4>
                                </ActionBar>
                            </li>
                        {/each}
                    </ul>
                </details>
            {/each}
        </div>
    </div>
    {/if}

    {#if showNestedPopupContent}
        <div class="bg-gray-100 absolute top-0 right-0 left-0">
            <header class="bg-white px-14 py-4 grid grid-cols-4 justify-center">
                <a class="cursor-pointer underline col-span-1 text-left self-center"
                   on:click|preventDefault={togglePopupContent}
                   href="#"
                >
                    ‹ Retour
                </a>
                <h2 id="dialog-title" class="text-3xl font-bold col-span-2 text-center self-center py-4">Lier une action</h2>
                <input type="search" class="col-span-1 border border-gray-400 self-center p-2" placeholder="Rechercher" />
            </header>

            <div class="p-14 focus:bg-gray-100 custom-oveflow">
                <div class="block flex p-4 bg-white mb-20 shadow-lg text-lg relative">
                    <ButtonIcon classNames="flex-none mr-4 self-center">+</ButtonIcon>
                    <div>
                        <div class="flex">
                            <h3 class="text-xl font-bold flex-initial self-center mr-4">{topLevelAction.nom}</h3>
                            <Button size="small"
                                    colorVariant="bramble"
                                    classNames="cursor-pointer self-center flex-none"
                                    on:click={() => actionDescriptionDisplayed = !actionDescriptionDisplayed }
                            >
                                Détails
                            </Button>
                        </div>
                        <div class:hidden={!actionDescriptionDisplayed} class="text-base pt-4">
                            {topLevelAction.description}
                        </div>
                    </div>
                </div>

                <ul>
                    <li>
                        {#each topLevelAction.actions as action (action.id) }
                            {#if action.actions.length > 0 }
                                <ActionExpandable action={action}></ActionExpandable>
                            {:else }
                                <ActionBar withShadow handleClick={() => {}}>
                                    <ButtonIcon slot="aside">+</ButtonIcon>
                                    <h4 class="underline:hover self-center mr-4">
                                        {action.nom}
                                    </h4>
                                </ActionBar>
                            {/if}
                        {/each}
                    </li>
                </ul>
            </div>
        </div>
    {/if}

</Dialog>