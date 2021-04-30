<script lang="ts">
    import {ActionReferentiel} from '../../../../generated/models/action_referentiel'
    import SimpleBar from '../../../components/shared/SimpleBar.svelte'
    import PickButton from '../../../components/shared/Button/PickButton.svelte'
    import ActionReferentielTitle from '../../../components/shared/ActionReferentiel/ActionReferentielTitle.svelte'
    import Angle from '../../../components/shared/Angle.svelte'

    // Main action of the bar
    export let action: ActionReferentiel

    // Handle click on main content
    export let onTitleClick: (event: MouseEvent) => void = () => {}

    // Display correct label on PickButton depending on if the action is linked to the current fiche,
    export let isAdded: boolean

    // Handle pick button add callback
    export let handleAdd

    // Handle pick button remove callback
    export let handleRemove

    // Enable expansion on the bar
    export let isExpandable

    // Handle bar shadow
    let sizes = ['2xl', 'xl', 'l', 'md', '', 'sm']
    $: depth = action.id.split('.').length
    $: isCitergie = action.id.startsWith('citergie')
    $: shadowSize = sizes[depth - (isCitergie ? 0 : 1)]

    // Handle expand
    let expanded:boolean = false
    const handleExpand = () => {
        expanded = !expanded
    }
</script>

<SimpleBar id={action.id} shadowSize={shadowSize}>
    <PickButton picked={isAdded}
                handlePick={() => handleAdd(action.id)}
                handleUnpick={() => handleRemove(action.id)}
                pickLabel="+"
                unpickLabel="✓ Ajouté"
                slot="aside"
    />

    <div on:click={isExpandable ? handleExpand : null}
         class="flex flex-row cursor-pointer items-stretch"
    >
        <ActionReferentielTitle on:click={onTitleClick} action={action} emoji />

        {#if isExpandable }
            <Angle direction="{expanded ? 'down' : 'right' }"/>
        {/if}
    </div>
</SimpleBar>

{#if expanded }
    {#if action.description.trim().length }
        <div class="flex m-4">
            {action.description}
        </div>
    {/if}

    {#if $$slots.children }
        <div class="ml-6">
            <slot name="children"></slot>
        </div>
    {/if}
{/if}