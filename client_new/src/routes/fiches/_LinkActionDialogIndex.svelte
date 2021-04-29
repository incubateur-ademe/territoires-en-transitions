<script lang="ts">
    /**
     * Display a list of action filtered by thematics
     */
    import {actions} from "../../../generated/data/actions_referentiels";
    import {thematiques} from "../../../generated/data/thematiques";
    import ActionReferentielCard from '../../components/shared/ActionReferentiel/ActionReferentielCard.svelte'

    export let onTopLevelActionClicked: (actionId: string) => void
    export let close: (event: MouseEvent) => void

    // Handle add/remove button callback of each action
    export let handleActionButton

    // Helper handler to check if an action is linked to the current fiche
    export let isActionLinkedToFiche: (string) => boolean

    const handleAddButtonClick = (action) => (_event) => handleActionButton(action.id)
    const handleTitleClick = (action) => (_event) => onTopLevelActionClicked(action.id)
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

    <div class="p-14 focus:bg-gray-100 custom-overflow">
        {#each thematiques as thematique }
            <details class="expandable expandable__with-arrow cursor-pointer">
                <summary class="flex content-center">
                    <h3 class="text-3xl font-bold mb-10 mr-4">{thematique.name}</h3>
                </summary>
                <ul class="mb-16">
                    {#each actions.filter((action) => action.thematique_id === thematique.id) as action (action.id) }
                        <li>
                            <ActionReferentielCard emoji
                                                   action={action}
                                                   addButton
                                                   isActionLinkedToFiche={isActionLinkedToFiche}
                                                   onAddButtonClick={handleAddButtonClick}
                                                   onTitleClick={handleTitleClick}
                            />
                        </li>
                    {/each}
                </ul>
            </details>
        {/each}
    </div>
</div>
