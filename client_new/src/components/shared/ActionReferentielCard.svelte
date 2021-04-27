<script lang="ts">
    /**
     * Display an ActionReferentiel as a card.
     *
     * Display is customizable using props such as: ficheButton, link, emoji...
     */
    import ActionStatus from "./ActionStatus.svelte";
    import {ActionReferentiel} from "../../../generated/models/action_referentiel";
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../api/currentEpci";
    import Angle from "./Angle.svelte";
    import ActionReferentielTitle from "./ActionReferentielTitle.svelte";
    import AddFiche from "../icons/AddFiche.svelte";

    export let action: ActionReferentiel

    // Show create a fiche from this action
    export let ficheButton: boolean = false

    // The title links to the action page.
    export let link: boolean = false

    // Show referentiel emoji
    export let emoji: boolean = false

    // Show expand children button
    export let expandButton: boolean = false

    // Show the action status picker bar
    export let statusBar: boolean = false


    $: depth = action.id.split('.').length
    $: isCitergie = action.id.startsWith('citergie')
    $: isMesure = isCitergie ? depth === 3 : depth === 2
    $: mesureId = isCitergie ? action.id.split('.').slice(0, 3).join('.') : action.id.split('.').slice(0, 2).join('.')

    let expanded = false
    const handleExpand = () => {
        expanded = !expanded
    }

    // The action the link points to
    let href: string = ''


    let epciId = ''
    onMount(async () => {
        epciId = getCurrentEpciId()
    })
</script>


<div class="flex flex-col mb-5 relative" id="{action.id}">
    <div class="flex flex-row items-center px-4 pt-5 pb-4 bg-white
                transform translate-y-0.5 hover:translate-y-0
                { ['hover:hovershadow-2xl', 'hover:shadow-2xl', 'hover:shadow-xl', 'hover:shadow-lg', 'hover:shadow-md', 'hover:shadow', 'hover:shadow-sm'][depth - (isCitergie ? 0 : 1)] }
                { ['shadow-2xl', 'shadow-2xl', 'shadow-xl', 'shadow-lg', 'shadow-md', 'shadow', 'shadow-sm'][depth + (isCitergie ? 0 : 1)] }">
        {#if ficheButton}
            <a class="opacity-50 hover:opacity-80 mr-2"
               href="fiches/creation/?epci_id={epciId}&action_id={action.id}">
                <AddFiche/>
            </a>
        {/if}

        <div class="flex items-center flex-grow"
             class:statusBar={"max-w-lg"}>
            {#if link}
                <a href="/actions_referentiels/{mesureId}/?epci_id={epciId}#{action.id}"
                   rel="prefetch"
                   class="flex flex-grow">
                    <ActionReferentielTitle action={action} emoji={emoji}/>
                </a>
            {:else if expandButton && (action.actions.length || action.description.trim().length) }
                <div class="flex flex-row cursor-pointer items-stretch"
                     on:click={handleExpand}>
                    <ActionReferentielTitle on:click={handleExpand} action={action} emoji={emoji}/>
                    <Angle direction="{expanded ? 'down' : 'right' }"/>
                </div>
            {:else }
                <ActionReferentielTitle action={action} emoji={emoji}/>
            {/if}
        </div>
        {#if statusBar}
            <div class="ml-4">
                <ActionStatus actionId={action.id}/>
            </div>
        {/if}
    </div>

    {#if expanded && action.description.trim().length }
        <div class="flex m-4">
            {action.description}
        </div>
    {/if}
</div>

{#if expanded}
    <div class="ml-6">
        {#each action.actions as action}
            <svelte:self action={action}
                         ficheButton={ficheButton}
                         link={link}
                         expandButton={expandButton}
                         statusBar={statusBar}/>
        {/each}
    </div>
{/if}
