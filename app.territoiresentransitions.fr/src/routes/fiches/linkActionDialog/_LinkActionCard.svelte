<script lang="ts">
    /**
     * Displays an action along with a PickButton to link the action to the current fiche.
     */
    import {ActionReferentiel} from '../../../../../generated/models/action_referentiel'
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

<RowCard id={action.id} shadowSize={shadowSize}>
    <PickButton handlePick={handlePick}
                handleUnpick={handlePick}
                pickLabel="+"
                picked={added}
                unpickLabel="✓ Ajouté"/>

    <div class="flex flex-row cursor-pointer items-stretch"
         on:click={expandable ? handleExpand : null}>
        <ActionReferentielTitle action={action} emoji on:click={onTitleClick}/>

        {#if expandable }
            <Angle direction="{expanded ? 'down' : 'right' }"/>
        {/if}
    </div>
</RowCard>

{#if expanded }
    {#if action.description.trim().length }
        <div class="flex m-4">
            {action.description}
        </div>
    {/if}

    <div class="ml-6">
        {#each action.actions as action}
            <svelte:self action={action}
                         linkedActionIds={linkedActionIds}
                         toggleActionId={toggleActionId}/>
        {/each}
    </div>
{/if}