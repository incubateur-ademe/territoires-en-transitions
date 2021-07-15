<script lang="ts">
    /**
     * Displays an action list sorted by thématiques
     *
     * Passes linkedActionIds and toggleActionId props along to its children.
     */
    import {actions} from "../../../generated/data/actions_referentielsels";
    import {thematiques} from "../../../generated/data/thematiquesues";
    import LinkActionCard from './_LinkActionCard'

    export let onTopLevelActionClicked: (actionId: string) => void
    export let close: (event: MouseEvent) => void

    // List of linked actions of the current fiche
    export let linkedActionIds: string[]

    // Handle add/remove button callback of each action
    export let toggleActionId: (actionId: string) => void

    // Helper handler to check if an action is linked to the current fiche
    $: isActionLinkedToFiche = (actionId) => linkedActionIds.includes(actionId)
</script>

<style>
    details + details {
        margin-top: 3rem;
    }

    :global(summary::-webkit-details-marker) {
        display: none;
    }

    details[open] summary {
        margin-bottom: 1.875rem;
    }

    details[open] summary span {
        transform: rotate(90deg);
    }

    summary {
        display: flex;
        align-items: center;
    }

    summary h2 {
        margin-bottom: 0;
    }

    summary span {
        margin-bottom: -0.625rem;
        margin-left: 1rem;
    }

    summary span::before {
        font-size: 2rem;
    }

    article + article {
        margin-top: 1.5rem;
    }
</style>

{#each thematiques as thematique }
    <details>
        <summary>
            <h2>{thematique.name}</h2>

            <span class="fr-fi-arrow-right-s-line" aria-hidden="true"></span>
        </summary>

        {#each actions.filter((action) => action.thematique_id === thematique.id) as action (action.id) }
            <LinkActionCard action={action}
                            linkedActionIds={linkedActionIds}
                            toggleActionId={toggleActionId}
                            onTitleClick={() => onTopLevelActionClicked(action.id)}/>
        {/each}
    </details>
{/each}
