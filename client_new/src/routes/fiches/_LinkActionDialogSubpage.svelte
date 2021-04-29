<script lang="ts">
    import ButtonIcon from '../../components/shared/Button/ButtonIcon.svelte'
    import Button from '../../components/shared/Button/Button.svelte'
    import ActionExpandable from '../../components/shared/Action/ActionExpandable.svelte'
    import ActionBar from '../../components/shared/Action/ActionBar.svelte'
    import {ActionReferentiel} from "../../../generated/models/action_referentiel";
    import ActionReferentielCard from '../../components/shared/ActionReferentiel/ActionReferentielCard.svelte'

    export let topLevelAction: ActionReferentiel

    export let togglePopupContent: () => void

    // Handle add/remove button callback of each action
    export let handleActionButton

    // Helper handler to check if an action is linked to the current fiche
    export let isActionLinkedToFiche: (string) => boolean

    let actionDescriptionDisplayed = false

    const handleAddButtonClick = (action) => (_event) => handleActionButton(action.id)
</script>

<style>
    .custom-overflow {
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

<div class="bg-gray-100 absolute top-0 right-0 left-0">
    <header class="bg-white px-14 py-4 grid grid-cols-4 justify-center">
        <a class="cursor-pointer underline col-span-1 text-left self-center"
           href="#"
           on:click|preventDefault={togglePopupContent}
        >
            ‹ Retour
        </a>
        <h2 class="text-3xl font-bold col-span-2 text-center self-center py-4" id="dialog-title">Lier une action</h2>
        <input class="col-span-1 border border-gray-400 self-center p-2" placeholder="Rechercher" type="search"/>
    </header>

    <div class="p-14 focus:bg-gray-100 custom-overflow">
        <div class="block flex p-4 bg-white mb-20 shadow-lg text-lg relative">
            <ButtonIcon classNames="flex-none mr-4 self-center">+</ButtonIcon>
            <div>
                <div class="flex">
                    <h3 class="text-xl font-bold flex-initial self-center mr-4">{topLevelAction.nom}</h3>
                    <Button classNames="cursor-pointer self-center flex-none"
                            colorVariant="bramble"
                            on:click={() => actionDescriptionDisplayed = !actionDescriptionDisplayed }
                            size="small"
                    >
                        Détails
                    </Button>
                </div>
                <div class="text-base pt-4" class:hidden={!actionDescriptionDisplayed}>
                    {topLevelAction.description}
                </div>
            </div>
        </div>

        <ul>
            <li>
                {#each topLevelAction.actions as action (action.id) }
                    <ActionReferentielCard action={action}
                                           emoji
                                           expandButton
                                           addButton
                                           isActionLinkedToFiche={isActionLinkedToFiche}
                                           onAddButtonClick={handleAddButtonClick}
                    />
                {/each}
            </li>
        </ul>
    </div>
</div>