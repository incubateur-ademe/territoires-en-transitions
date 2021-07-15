<script lang="ts">
    /**
     * Displays an action along with a PickButton to link the action to the current fiche.
     */
    import {ActionReferentiel} from '../../../generated/models/action_referentieliel'
    import RowCard from '../../../components/shared/RowCard.svelte'
    import PickButton from '../../../components/shared/Button/PickButton.svelte'
    import ActionReferentielTitle from '../../../components/shared/ActionReferentiel/ActionReferentielTitle.svelte'
    import Angle from '../../../components/shared/Angle.svelte'

    // Main action of the bar
    export let action: ActionReferentiel

    // Title click callback
    export let onTitleClick: (event: MouseEvent) => void = () => {
    }

    // The list of action ids of the current fiche from the Form.
    export let linkedActionIds: string[]

    // The callback from the Form.
    export let toggleActionId: (actionId: string) => void

    // Enable expansion on the bar
    export let expandable: boolean = false

    // Used to switch the PickButton text
    let added: boolean

    // Handle bar shadow
    let sizes = ['2xl', 'xl', 'l', 'md', '', 'sm']
    $: depth = action.id.split('.').length
    $: isCitergie = action.id.startsWith('citergie')
    $: shadowSize = sizes[depth - (isCitergie ? 0 : 1)]
    $: added = linkedActionIds.includes(action.id)

    // Handle expand
    let expanded: boolean = false
    const handleExpand = () => {
        expanded = !expanded
    }

    // Called on pick and unpick regardless.
    const handlePick = () => {
        toggleActionId(action.id)
    }

</script>

<style>
    div:first-child,
    .title {
        display: flex;
        align-items: center;
    }

    .title {
        margin-left: 1rem;
    }

    .title.expandable {
        cursor: pointer;
    }

    .title :global(h3) {
        margin-bottom: 0;
    }

    .title span {
        margin-left: .5rem;
    }

    .title.expanded span {
        transform: rotate(90deg);
    }

    .subActions {
        margin-top: 3rem;
        margin-bottom: 3rem;
        margin-left: 3rem;
    }
</style>

<RowCard id={action.id}>
    <div>
        <PickButton handlePick={handlePick}
                    handleUnpick={handlePick}
                    pickLabel="Ajouter"
                    picked={added}
                    unpickLabel="Supprimer"/>

        <div class="title {expandable ? 'expandable' : null} {expanded? 'expanded' : null}" on:click={expandable ?
        handleExpand : null}>
            <ActionReferentielTitle action={action} on:click={onTitleClick}/>

            {#if expandable}
                <span class="fr-fi-arrow-right-s-line" aria-hidden="true"></span>
            {/if}
        </div>
    </div>
</RowCard>

{#if expanded }
    <div class="subActions">
        {#if action.description.trim().length }
            <div class="description">
                {@html action.description}
            </div>
        {/if}

        {#each action.actions as action}
            <svelte:self action={action}
                         linkedActionIds={linkedActionIds}
                         toggleActionId={toggleActionId}/>
        {/each}
    </div>
{/if}