<script lang="ts">
    /**
     * Displays the sub action of its topLevelAction.
     * Allows searching in the list.
     *
     * Passes linkedActionIds and toggleActionId props along to its children.
     */
    import type {ActionReferentiel} from "$generated/models/action_referentiel";
    import LinkActionCard from './_LinkActionCard.svelte'
    import PickButton from "$components/shared/ButtonV2/PickButton.svelte";
    import RowCard from "$components/shared/RowCard.svelte";

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

    .intro {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 2rem;
    }

    ul {
        margin-top: 2rem;
    }
</style>

<div class="intro">
    <button class="fr-btn fr-btn--secondary fr-btn--sm fr-fi-arrow-left-s-line fr-btn--icon-left"
            on:click|preventDefault={handleBack}>
        Retour
    </button>

    <!-- Hidden til the search engine works
    <ReferentielSearchBar actions={topLevelAction.actions}
                          bind:matches={displayedActions}
                          bind:needle={needle}/>
                          -->
</div>

<div>
    {#if notSearching}
        <div>
            <RowCard id={topLevelAction.id}>
                <PickButton picked={isActionLinkedToFiche(topLevelAction.id)}
                            handlePick={handleTopLevelPick}
                            handleUnpick={handleTopLevelPick}
                            pickLabel="Ajouter"
                            unpickLabel="Supprimer"
                />

                <h3>{topLevelAction.nom}</h3>

                {@html topLevelAction.description}
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