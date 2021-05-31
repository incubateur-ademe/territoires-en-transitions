<script lang="ts">
    /**
     * Displays the sub action of its topLevelAction.
     * Allows searching in the list.
     *
     * Passes linkedActionIds and toggleActionId props along to its children.
     */
    import {ActionReferentiel} from "../../../../../generated/models/action_referentiel";
    import ReferentielSearchBar from '../../../components/shared/ReferentielSearchBar.svelte'
    import LinkActionCard from './_LinkActionCard'
    import PickButton from "../../../components/shared/Button/PickButton.svelte";
    import Button from "../../../components/shared/Button/Button.svelte";
    import RowCard from "../../../components/shared/RowCard.svelte";

    // Main action of the subpage
    export let topLevelAction: ActionReferentiel

    // Handle the popup content
    export let handleBack: () => void

    // List of linked actions of the current fiche
    export let linkedActionIds: string[]

    // Handle add/remove button callback of each action
    export let toggleActionId: (actionId: string) => void

    // Helper handler to check if an action is linked to the current fiche
    $: isActionLinkedToFiche = (actionId) => linkedActionIds.includes(actionId)

    // Show main action description
    let actionDescriptionDisplayed = false

    // Called on pick and unpick regardless.
    const handleTopLevelPick = () => {
        toggleActionId(topLevelAction.id)
    }

    // Search state
    let displayedActions: ActionReferentiel[] = topLevelAction.actions
    let needle: string
    $: notSearching = !needle
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
        <button class="cursor-pointer underline col-span-1 text-left self-center"
                on:click|preventDefault={handleBack}>
            ‹ Retour
        </button>
        <h2 class="text-3xl font-bold col-span-2 text-center self-center py-4" id="dialog-title">Lier une action</h2>
        <ReferentielSearchBar actions={topLevelAction.actions}
                              bind:matches={displayedActions}
                              bind:needle={needle}/>
    </header>

    <div class="p-14 focus:bg-gray-100 custom-overflow">

        {#if notSearching}
            <div class="mb-10">
                <RowCard id={topLevelAction.id} shadowSize="lg">
                    <PickButton picked={isActionLinkedToFiche(topLevelAction.id)}
                                handlePick={handleTopLevelPick}
                                handleUnpick={handleTopLevelPick}
                                pickLabel="+"
                                unpickLabel="✓ Ajouté"
                    />
                    <div>
                        <div class="flex">
                            <h3 class="text-xl font-bold flex-initial self-center mr-4">{topLevelAction.nom}</h3>
                            <Button classNames="cursor-pointer self-center flex-none"
                                    colorVariant="bramble"
                                    on:click={() => actionDescriptionDisplayed = !actionDescriptionDisplayed }
                                    size="small">
                                Détails
                            </Button>
                        </div>
                        <div class="text-base pt-4" class:hidden={!actionDescriptionDisplayed}>
                            {topLevelAction.description}
                        </div>
                    </div>
                </RowCard>
            </div>
        {/if}

        <ul>
            <li>
                {#each displayedActions as action (action.id) }
                    <LinkActionCard action={action}
                                    expandable
                                    linkedActionIds={linkedActionIds}
                                    toggleActionId={toggleActionId}/>
                {/each}
            </li>
        </ul>
    </div>
</div>