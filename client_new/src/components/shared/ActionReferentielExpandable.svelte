<script lang="ts">
    import ActionStatus from "./ActionStatus.svelte";
    import {ActionReferentiel} from "../../../generated/models/action_referentiel";
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../api/currentEpci";
    import AddFiche from "../icons/AddFiche.svelte";
    import Button from "./Button/Button.svelte";

    export let action: ActionReferentiel
    $: depth = action.id.split('.').length

    let showDetails = false
    const handleDetails = () => {
        showDetails = !showDetails
    }

    let showNested = false
    $: chevron = showNested ? "\/" : '>'
    const handleMore = () => {
        showNested = !showNested
    }

    let epciId = ''
    onMount(async () => {
        epciId = getCurrentEpciId()
    })
</script>


<div class="flex flex-col">
    <div class="flex flex-row">
        <a href="fiches/creation/?epci_id={epciId}&action_id={action.id}">
            <AddFiche/>
        </a>
        <h3 class="pr-28">({action.id}) {action.nom}</h3>

        {#if depth === 3}
            <Button label="Détails"
                    on:click={handleDetails}/>
        {/if}
        {#if action.actions.length }
            <Button on:click={handleMore}
                    label={chevron}/>
        {/if}
        <ActionStatus actionId={action.id}/>
    </div>

    {#if showDetails}
        <div class="flex m-4">
            {action.description}
        </div>
    {/if}
</div>

{#if showNested}
    <div class="ml-5">
        {#each action.actions as action}
            <svelte:self action={action}/>
        {/each}
    </div>
{/if}
