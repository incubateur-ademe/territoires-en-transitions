<script lang="ts">
    /**
     * Display an ActionReferentiel as a card.
     *
     * Display is customizable using props such as: ficheButton, link…
     */
    import {goto} from '@sapper/app'
    import ActionStatus from "../ActionStatus.svelte";
    import {ActionReferentiel} from "../../../../../generated/models/action_referentiel";
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../../api/currentEpci";
    import ActionReferentielTitle from "./ActionReferentielTitle.svelte";
    import PickButton from '../Button/PickButton.svelte'
    import RowCard from "../RowCard.svelte";
    import ProgressStat from "./ProgressStat.svelte";
    import {ActionReferentielScore} from "../../../../../generated/models/action_referentiel_score";
    import ActionReferentielCommentaire from "./ActionReferentielCommentaire.svelte";
    import ActionReferentielDescription from "./ActionReferentielDescription.svelte";

    type ActionClick = (action: ActionReferentiel) => (event: MouseEvent) => void

    export let action: ActionReferentiel

    // Show create a fiche from this action
    export let ficheButton: boolean = false

    // The title links to the action page.
    export let link: boolean = false

    // Show expand children button
    export let expandButton: boolean = false

    // Show the action status picker bar
    export let statusBar: boolean = false

    // Show an add button
    export let addButton: boolean = false

    // Adds a border to the Card
    export let borderedCard: boolean = false

    // Displays the comment part
    export let commentBlock: boolean = false

    // Displays children of the card
    export let recursive: boolean = false

    // Handle add/remove button callback
    export let onAddButtonClick: ActionClick = (action) => (event) => {
    }

    // Handle title click
    export let onTitleClick: ActionClick = (action) => (event) => {
    }

    // Helper handler to check if an action is linked to the current fiche
    export let isActionLinkedToFiche: (string) => boolean = (_) => false;

    $: depth = action.id.split('.').length
    $: isCitergie = action.id.startsWith('citergie')
    $: isMesure = isCitergie ? depth === 3 : depth === 2
    $: mesureId = isCitergie ? action.id.split('.').slice(0, 3).join('.') : action.id.split('.').slice(0, 2).join('.')

    // card shadow
    let sizes = ['2xl', 'xl', 'l', 'md', '', 'sm']
    $: shadowSize = sizes[depth - (isCitergie ? 0 : 1)]

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

    export let score: ActionReferentielScore | null = null

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

<style>
    .label {
        display: inline-block;
        margin-bottom: 1rem;
        font-size: 0.75rem;
    }

    .RowCard__linkOnly {
        display: flex;
        flex-direction: column;
    }

    .RowCard__linkOnly > div {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        width: 100%;
    }

    .RowCard__linkOnly .RowCard__title {
        flex-direction: column;
        max-width: 75%;
    }

    .RowCard__linkOnly .fr-fi-arrow-right-line {
        align-self: flex-end;
        color: var(--bf500);
    }

    .RowCard__title,
    .RowCard__content {
        display: flex;
        justify-content: space-between;
    }

    .RowCard__title {
        align-items: flex-start;
    }

    .RowCard__title :global(:first-child) {
        max-width: 75%;
    }

    .RowCard__content {
        align-items: center;
    }

    .RowCard__content:not(:last-child) {
        margin-bottom: 1.5rem;
    }

    .listActions__subList {
        margin-top: 1.25rem;
        margin-left: 5.313rem;
    }

    .listActions__subList :global(h3 span) {
        display: block;
        margin-bottom: 1rem;
        font-size: 0.75rem;
        font-weight: normal;
    }
</style>

<RowCard bordered={borderedCard} id={action.id} shadowSize={shadowSize}>
    {#if addButton}
        <PickButton picked={isAdded}
                    handlePick={handleToggleButtonClick}
                    handleUnpick={handleToggleButtonClick}
                    pickLabel="+"
                    unpickLabel="✓ Ajouté"
        />
    {/if}

    <div>
        {#if link}
            <a href="/actions_referentiels/{mesureId}/?epci_id={epciId}#{action.id}"
               rel="prefetch" class="RowCard__linkOnly">

                <div>
                    <div class="RowCard__title">
                        <span class="label">{action.id.startsWith('citergie') ? "Cit'ergie" : 'Économie circulaire'}</span>

                        <ActionReferentielTitle
                                on:click={() => goto(`/actions_referentiels/${mesureId}/?epci_id=${epciId}#${action.id}`)}
                                action={action}/>
                    </div>

                    <ProgressStat position="right" action={action}/>
                </div>

                <span class="fr-fi-arrow-right-line"></span>
            </a>
        {:else }
            <div class="RowCard__title">
                <ActionReferentielTitle on:click={onTitleClick(action)} action={action}/>

                <ProgressStat position="right" action={action}/>
            </div>
        {/if}
    </div>

    {#if ficheButton && statusBar}
        <div class="RowCard__content">
            <a class="fr-btn fr-btn--secondary fr-btn--sm fr-fi-file-fill fr-btn--icon-left"
               href="fiches/creation/?epci_id={epciId}&action_id={action.id}">
                Créer une fiche-action
            </a>

            {#if action.actions.length === 0}
                <ActionStatus actionId={action.id}/>
            {/if}
        </div>
    {/if}

    <ActionReferentielDescription action={action}/>

    {#if commentBlock}
        <ActionReferentielCommentaire action={action}/>
    {/if}
</RowCard>

{#if recursive}
    <div class="listActions__subList">
        {#each action.actions as action}
            <svelte:self action={action}
                         ficheButton={ficheButton}
                         link={link}
                         expandButton={expandButton}
                         statusBar={statusBar}
                         addButton={addButton}
                         onAddButtonClick={onAddButtonClick}
                         isActionLinkedToFiche={isActionLinkedToFiche}
                         commentBlock={true}
            >
            </svelte:self>
        {/each}
    </div>
{/if}