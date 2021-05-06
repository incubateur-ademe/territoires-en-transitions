<script lang="ts">
    import SimpleBar from './../../components/shared/SimpleBar.svelte'
    import {ActionReferentiel} from "../../../generated/models/action_referentiel";
    import AddFicheIcon from '../../components/icons/AddFiche.svelte'
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../api/currentEpci";
    import ActionReferentielTitle from '../../components/shared/ActionReferentiel/ActionReferentielTitle.svelte'
    import Angle from '../../components/shared/Angle.svelte'
    import ActionStatus from '../../components/shared/ActionStatus.svelte'

    // Main action of the bar
    export let action: ActionReferentiel

    // Handle click on main content
    export let onTitleClick: (event: MouseEvent) => void = () => {
    }

    // Show fiche button
    export let ficheButton: boolean = false

    // Show the action status picker bar
    export let statusBar: boolean = false

    // Show referentiel emoji
    export let emoji: boolean = false

    // Enable expansion on the bar
    export let isExpandable

    // Use link for the bar content
    export let asLink: boolean = false

    // Handle bar shadow
    let sizes = ['2xl', 'xl', 'l', 'md', '', 'sm']
    $: depth = action.id.split('.').length
    $: isCitergie = action.id.startsWith('citergie')
    $: shadowSize = sizes[depth - (isCitergie ? 0 : 1)]

    // Init mesure id
    $: mesureId = isCitergie ? action.id.split('.').slice(0, 3).join('.') : action.id.split('.').slice(0, 2).join('.')

    // Handle expand
    let expanded: boolean = false
    const handleExpand = () => expanded = !expanded

    // Init current EPCI id
    let epciId = ''
    onMount(async () => {
        epciId = getCurrentEpciId()
    })
</script>

<SimpleBar id={action.id} shadowSize={shadowSize}>
    <div class="flex flex-row flex-grow items-center">

        {#if ficheButton}
            <a class="opacity-50 hover:opacity-80 mr-2"
               href="fiches/creation/?epci_id={epciId}&action_id={action.id}">
                <AddFicheIcon/>
            </a>
        {/if}

        <div class="flex flex-row flex-grow">
            {#if asLink}
                <a href="/actions_referentiels/{mesureId}/?epci_id={epciId}#{action.id}"
                   rel="prefetch"
                   class="flex flex-grow">
                    <ActionReferentielTitle
                            on:click={() => window.location.href = `/actions_referentiels/${mesureId}/?epci_id=${epciId}#${action.id}`}
                            action={action} emoji={emoji}/>
                </a>
            {:else }
                <div on:click={isExpandable ? handleExpand : null}
                     class="flex flex-row cursor-pointer items-center">
                    <ActionReferentielTitle on:click={onTitleClick} action={action} emoji={emoji}/>

                    {#if isExpandable }
                        <Angle direction="{expanded ? 'down' : 'right' }"/>
                    {/if}
                </div>
            {/if}
        </div>

        {#if statusBar}
            <div class="ml-4">
                <ActionStatus actionId={action.id}/>
            </div>
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
