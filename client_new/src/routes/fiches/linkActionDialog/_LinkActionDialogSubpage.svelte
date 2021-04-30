<script lang="ts">
    import Button from '../../../components/shared/Button/Button.svelte'
    import {ActionReferentiel} from "../../../../generated/models/action_referentiel";
    import ReferentielSearchBar from '../../../components/shared/ReferentielSearchBar.svelte'
    import PickButton from '../../../components/shared/Button/PickButton.svelte'
    import ActionReferentielTree from './_ActionReferentielTree.svelte'
    import SimpleBar from '../../../components/shared/SimpleBar.svelte'

    // Main action of the subpage
    export let topLevelAction: ActionReferentiel

    // Handle the popup content
    export let togglePopupContent: () => void

    // List of linked actions of the current fiche
    export let linkedActionIds: string[]

    // Handle add/remove button callback of each action
    export let handlePickButton: () => void

    // Helper handler to check if an action is linked to the current fiche
    type isActionLinkedToFicheType = (actionId: string) => boolean
    $: isActionLinkedToFiche: isActionLinkedToFicheType = (actionId) => linkedActionIds.includes(actionId)

    // Show main action description
    let actionDescriptionDisplayed = false

    // Handle search display
    let displayedActions: ActionReferentiel[] = topLevelAction.actions
    let isSearching: string
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
           on:click|preventDefault={togglePopupContent}
        >
            ‹ Retour
        </button>
        <h2 class="text-3xl font-bold col-span-2 text-center self-center py-4" id="dialog-title">Lier une action</h2>
        <ReferentielSearchBar actions={topLevelAction.actions}
                              bind:matches={displayedActions}
                              bind:needle={isSearching}
        />
    </header>

    <div class="p-14 focus:bg-gray-100 custom-overflow">
        {#if !isSearching }
            <div class="mb-10">
                <SimpleBar id={topLevelAction.id} shadowSize="lg">
                    <PickButton picked={isActionLinkedToFiche(topLevelAction.id)}
                                handlePick={() => handlePickButton(topLevelAction.id)}
                                handleUnpick={() => handlePickButton(topLevelAction.id)}
                                pickLabel="+"
                                unpickLabel="✓ Ajouté"
                    />
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
                </SimpleBar>
            </div>
        {/if}

        <ul>
            <li>
                {#each displayedActions as action (action.id) }
                    <ActionReferentielTree action={action}
                                           linkedActionIds={linkedActionIds}
                                           handlePickButton={handlePickButton}
                    />
                {/each}
            </li>
        </ul>
    </div>
</div>