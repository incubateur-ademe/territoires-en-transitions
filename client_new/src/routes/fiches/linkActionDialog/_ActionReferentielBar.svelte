<script lang="ts">
    import {ActionReferentiel} from '../../../../generated/models/action_referentiel'
    import SimpleBar from './SimpleBar.svelte'
    import PickButton from '../../../components/shared/Button/PickButton.svelte'
    import ActionReferentielTitle from '../../../components/shared/ActionReferentiel/ActionReferentielTitle.svelte'
    import Angle from '../../../components/shared/Angle.svelte'

    export let action: ActionReferentiel
    export let isAdded: boolean
    export let onTitleClick: (event: MouseEvent) => void = () => {}
    export let handleAdd
    export let handleRemove
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