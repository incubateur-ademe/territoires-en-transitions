<script lang="ts">
    /**
     * Display an ActionReferentiel as a card.
     *
     * Display is customizable using props such as: ficheButton, link, emoji...
     */
    import ActionStatus from "../ActionStatus.svelte";
    import {ActionReferentiel} from "../../../../generated/models/action_referentiel";
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../../api/currentEpci";
    import Angle from "../Angle.svelte";
    import ActionReferentielTitle from "./ActionReferentielTitle.svelte";
    import AddFiche from "../../icons/AddFiche.svelte";
    import ButtonIcon from '../Button/ButtonIcon.svelte'
    import Button from '../Button/Button.svelte'

    type ActionClick = (action: ActionReferentiel) => (event: MouseEvent) => void

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

    // Show an add button
    export let addButton: boolean = false

    // Handle add/remove button callback
    export let onAddButtonClick: ActionClick = (action) => (event) => {
    }

    // Handle title click
    export let onTitleClick: ActionClick = (action) => (event) => {
    }

    // Helper handler to check if an action is linked to the current fiche
    export let isActionLinkedToFiche: (string) => boolean

    $: depth = action.id.split('.').length
    $: isCitergie = action.id.startsWith('citergie')
    $: isMesure = isCitergie ? depth === 3 : depth === 2
    $: mesureId = isCitergie ? action.id.split('.').slice(0, 3).join('.') : action.id.split('.').slice(0, 2).join('.')

    let expanded = false
    const handleExpand = () => {
        expanded = !expanded
    }

    let epciId = ''

    // The action the link points to
    let href: string = ''

    // The label of the add button
    let isAdded: boolean = isActionLinkedToFiche(action.id)

    // Handle add/remove button click
    const handleToggleButtonClick = (event) => {
        onAddButtonClick(action)(event)
        updateAddButton()
    }

    // Update the add button depending on if it is linked to the current fiche or not
    const updateAddButton = () => {
        if (isActionLinkedToFiche(action.id)) {
            isAdded = true
            return
        }

        isAdded = false
    }

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

        {#if addButton}
            {#if isAdded}
                <Button on:click={handleToggleButtonClick} classNames="mr-4" colorVariant="pine">
                    ✔ Ajouté
                </Button>
            {:else }
                <ButtonIcon on:click={handleToggleButtonClick} classNames="mr-4">+</ButtonIcon>
            {/if}
        {/if}

        <div class="flex items-center flex-grow"
             class:statusBar={"max-w-lg"}>
            <slot name="aside"></slot>

            {#if link}
                <a href="/actions_referentiels/{mesureId}/?epci_id={epciId}#{action.id}"
                   rel="prefetch"
                   class="flex flex-grow">
                    <ActionReferentielTitle action={action} emoji={emoji}/>
                </a>
            {:else if expandButton && (action.actions.length || action.description.trim().length) }
                <div class="flex flex-row cursor-pointer items-stretch"
                     on:click={handleExpand}>
                    <ActionReferentielTitle action={action} emoji={emoji}/>
                    <Angle direction="{expanded ? 'down' : 'right' }"/>
                </div>
            {:else }
                <ActionReferentielTitle on:click={onTitleClick(action)} action={action} emoji={emoji}/>
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
                         statusBar={statusBar}
                         addButton={addButton}
                         onAddButtonClick={onAddButtonClick}
                         isActionLinkedToFiche={isActionLinkedToFiche}
            >
            </svelte:self>
        {/each}
    </div>
{/if}
